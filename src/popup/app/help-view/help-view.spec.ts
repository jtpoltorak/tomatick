import { TestBed } from '@angular/core/testing';
import { ABOUT } from '../../../shared/about';
import { HelpView } from './help-view';

describe('HelpView', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [HelpView] });
    const fixture = TestBed.createComponent(HelpView);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('explains the basics', () => {
    const el = setup();
    expect(el.querySelectorAll('.steps li').length).toBe(3);
    expect(el.textContent).toContain('Alt+Shift+P');
  });

  it('explains the technique in collapsible sections', () => {
    const el = setup();
    const topics = Array.from(el.querySelectorAll('details summary')).map((s) => s.textContent);
    expect(topics).toEqual(['What it is', 'Who invented it', 'Why it works']);
    expect(el.textContent).toContain('Francesco Cirillo');
    expect(el.querySelector('.trademark')?.textContent).toContain("isn't affiliated");
  });

  it('links to the contact address and the legal page', () => {
    const el = setup();
    const mail = el.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')!;
    expect(mail.textContent).toBe(ABOUT.email);
    const legal = Array.from(el.querySelectorAll<HTMLAnchorElement>('nav a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(legal).toEqual(['legal.html#privacy', 'legal.html#terms', 'legal.html#credits']);
    expect(el.querySelector('.fine')?.textContent).toContain(`© ${ABOUT.copyrightYear}`);
  });
});
