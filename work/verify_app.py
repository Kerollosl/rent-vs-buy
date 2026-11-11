from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / ".impeccable" / "review"
REVIEW.mkdir(parents=True, exist_ok=True)


def inspect_page(page, label: str) -> dict:
    page.goto("http://127.0.0.1:5173/")
    page.wait_for_load_state("networkidle")
    page.locator("#verdict-title").wait_for(state="visible")
    dimensions = page.evaluate(
        """() => ({
          viewport: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
          title: document.querySelector('#verdict-title')?.textContent,
          dashboard: document.querySelector('.dashboard')?.getBoundingClientRect().toJSON(),
          workspace: document.querySelector('.workspace')?.getBoundingClientRect().toJSON(),
        })"""
    )
    if dimensions["scroll"] > dimensions["viewport"] + 1:
        offenders = page.evaluate(
            """() => [...document.querySelectorAll('*')]
              .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
              .slice(0, 12)
              .map((element) => ({tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width, cssWidth: getComputedStyle(element).width, minWidth: getComputedStyle(element).minWidth, display: getComputedStyle(element).display}))"""
        )
        raise AssertionError(f"{label} has horizontal overflow: {dimensions}; offenders={offenders}")
    return dimensions


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    console_errors: list[str] = []

    desktop = browser.new_page(viewport={"width": 1440, "height": 1000})
    desktop.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    initial = inspect_page(desktop, "desktop")
    desktop.get_by_label("Purchase price", exact=True).fill("700000")
    desktop.get_by_label("Purchase price", exact=True).press("Tab")
    changed_title = desktop.locator("#verdict-title").inner_text()
    if changed_title == initial["title"]:
        raise AssertionError("Editing purchase price did not recalculate the verdict")
    desktop.get_by_role("button", name="% of price").click()
    desktop.get_by_label("Down payment", exact=True).fill("25")
    if desktop.get_by_label("Down payment", exact=True).input_value() != "25":
        raise AssertionError("Percent down-payment mode did not update")
    desktop.get_by_role("button", name="$ fixed").click()
    desktop.get_by_label("Annual maintenance", exact=True).fill("8500")
    if desktop.get_by_label("Annual maintenance", exact=True).input_value() != "8500":
        raise AssertionError("Fixed maintenance mode did not update")
    desktop.locator(".dashboard > .assumptions .advanced summary").click()
    if not desktop.get_by_label("Refinance year", exact=True).is_visible():
        raise AssertionError("Advanced accordion did not disclose refinancing")
    desktop.get_by_label("Refinance year", exact=True).fill("5")
    desktop.get_by_label("Refinance rate", exact=True).fill("4.5")
    desktop.locator(".dashboard > .assumptions .advanced summary").click()
    desktop.locator(".dashboard > .assumptions .folio-tab", has_text="rent").click()
    desktop.get_by_label("Initial investment", exact=True).fill("135000")
    desktop.get_by_label("Annual investment", exact=True).fill("3000")
    desktop.locator(".dashboard > .assumptions .folio-tab", has_text="buy").click()
    desktop.get_by_role("tab", name="Annual costs").click()
    desktop.get_by_text("Open year-by-year table", exact=True).click()
    if not desktop.locator("table").is_visible():
        raise AssertionError("Year-by-year table did not expand")
    desktop.get_by_label("Scenario name").fill("Verification scenario")
    desktop.get_by_role("button", name="Save", exact=True).click()
    if not desktop.locator(".scenario-row strong", has_text="Verification scenario").is_visible():
        raise AssertionError("Saved scenario was not rendered")
    desktop.get_by_role("button", name="Delete Verification scenario").click(force=True)
    desktop.get_by_role("button", name="Baseline", exact=True).click()
    desktop.get_by_role("tab", name="Net worth", exact=True).click()
    desktop.get_by_text("Open year-by-year table", exact=True).click()
    if desktop.locator(".recharts-surface path").count() < 2:
        raise AssertionError("Net-worth chart did not draw both paths")
    desktop.add_style_tag(content=".topbar,.assumptions{position:static!important;max-height:none!important}")
    desktop.wait_for_timeout(2600)
    desktop.screenshot(path=str(REVIEW / "desktop.png"), full_page=True)

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    inspect_page(mobile, "mobile")
    mobile.get_by_text("Adjust assumptions", exact=True).click()
    if not mobile.locator(".mobile-assumptions .folio-tab", has_text="buy").is_visible():
        raise AssertionError("Mobile assumption folio did not expand")
    mobile.get_by_role("button", name="10y", exact=True).click()
    if "year 10" not in mobile.locator("#verdict-title").locator("..").inner_text().lower():
        raise AssertionError("Mobile horizon control did not update the result")
    mobile.add_style_tag(content=".topbar{position:static!important}")
    mobile.wait_for_timeout(800)
    mobile.screenshot(path=str(REVIEW / "mobile.png"), full_page=True)

    if console_errors:
        raise AssertionError(f"Browser console errors: {console_errors}")

    invalid = browser.new_page(viewport={"width": 800, "height": 600})
    invalid.goto("http://127.0.0.1:5173/#eyJob3Jpem9uWWVhcnMiOjEwMDAwMDAwMH0=")
    invalid.wait_for_load_state("networkidle")
    if not invalid.get_by_role("status").get_by_text("Shared scenario was invalid").is_visible():
        raise AssertionError("Invalid shared scenario did not recover to baseline")

    print("desktop", initial)
    print("mobile and interaction checks passed")
    print("screenshots", REVIEW / "desktop.png", REVIEW / "mobile.png")
    browser.close()
