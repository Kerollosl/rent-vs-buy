from playwright.sync_api import sync_playwright, expect
from pathlib import Path

root = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in [1440, 390, 320]:
        page = browser.new_page(viewport={"width": width, "height": 900})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://localhost:5173/')
        page.wait_for_load_state('networkidle')
        expect(page.locator('.stress-row')).to_have_count(5)
        page.get_by_role('button', name='Budget & cash', exact=True).click()
        page.get_by_label('Monthly take-home income').fill('10000')
        page.get_by_label('Non-housing living expenses').fill('2000')
        page.get_by_label('Available cash savings').fill('200000')
        expect(page.locator('.budget-headroom')).to_be_visible()
        original = page.locator('.stress-row').first.inner_text()
        page.get_by_label('Show outcomes in today’s dollars').check()
        assert original != page.locator('.stress-row').first.inner_text()
        with page.expect_download() as download:
            page.get_by_role('button', name='Export configuration').click()
        exported = download.value.path()
        page.locator('input[type=file]').set_input_files(str(exported))
        expect(page.get_by_role('status').filter(has_text='Configuration loaded')).to_be_visible()
        page.locator('input[type=file]').set_input_files({'name': 'bad.json', 'mimeType': 'application/json', 'buffer': b'{}'})
        expect(page.get_by_role('status').filter(has_text='Could not import')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.get_by_role('button', name='Use dark theme').click()
        assert page.locator('#budget-title').evaluate('(e) => getComputedStyle(e).color') == 'rgb(240, 238, 231)'
        page.add_style_tag(content='.topbar{position:static!important}.toast{display:none!important}')
        page.locator('#budget').screenshot(path=str(root / '.impeccable/review' / f'budget-{width}.png'))
        assert not errors, errors
        page.close()
    browser.close()
print('Budget, inflation toggle, import round-trip, invalid import, dark mode, and 1440/390/320px checks passed.')
