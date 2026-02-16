import { describe, it, expect } from 'vitest';

// Functions to test
import { remToPx, reduceCalc, renderTemplate } from './render';

// Templates to test
import AuthenticationEmail from './templates/AuthenticationEmail.svelte';
import SubscriptionEmail from './templates/SubscriptionEmail.svelte';
import FileNotificationEmail from './templates/FileNotificationEmail.svelte';

// Test templates
import TestTemplateBasic from './test-data/TestTemplateBasic.svelte';
import TestTemplateGlobalStyles from './test-data/TestTemplateGlobalStyles.svelte';
import TestTemplateInline from './test-data/TestTemplateInline.svelte';

describe('renderTemplate()', () => {
  it('should render a simple component', () => {
    const output = renderTemplate(TestTemplateBasic, { name: 'Test' });
    expect(output).toMatch(/TEST EMAIL TEMPLATE/);
  });

  it('should inject global styles', () => {
    const output = renderTemplate(TestTemplateGlobalStyles, {});
    // The global styles should be injected and then removed after processing with juice
    expect(output).toMatch(/<body style="-moz-box-sizing: border-box;/);
    expect(output).not.toMatch(/<style id="global-styles">/);
  });

  // NOTE: This *works* but the styles are actually defined through the preferred
  // Svelte component mechanism but embeded in the HTML part.
  it('should inline styles and resolve variables', () => {
    const output = renderTemplate(TestTemplateInline, {});
    // The styles should be inlined and variables resolved
    expect(output).toContain('color: blue;');
    expect(output).toContain('font-weight: bold;');
  });

  it('should render the template: AuthenticationEmail', () => {
    const authUrl = 'https://example.com/auth';
    const output = renderTemplate(AuthenticationEmail, { authUrl });
    expect(output).toContain(authUrl);
  });

  it('should render the template: SubscriptionEmail', () => {
    const subscriptionsUrl = 'https://example.com/subscriptions';
    const authUrl = 'https://example.com/auth';
    const output = renderTemplate(SubscriptionEmail, { subscriptionsUrl, authUrl });
    expect(output).toContain(subscriptionsUrl);
    expect(output).toContain(authUrl);
  });

  it('should render the template: FileNotificationEmail', () => {
    // TODO: Get some fake subscription data
    const subscriptions = [];
    const output = renderTemplate(FileNotificationEmail, { subscriptions });
    expect(output).toContain('New apportionment files');
  });
});

describe('remToPx()', () => {
  it('should convert rem to px', () => {
    const input = 'font-size: 1.5rem;';
    const expected = 'font-size: 24px;';
    expect(remToPx(input)).toBe(expected);
  });

  it('should handle multiple rem values', () => {
    const input = 'margin: 0.5rem 1rem;';
    const expected = 'margin: 8px 16px;';
    expect(remToPx(input)).toBe(expected);
  });
});

describe('reduceCalc()', () => {
  it('should reduce simple calc expressions', () => {
    const input = 'width: calc(100% - 20%);';
    const expected = 'width:  80%;';
    expect(reduceCalc(input)).toBe(expected);
  });

  it('should not change non-calc expressions', () => {
    const input = 'color: red;';
    const expected = 'color: red;';
    expect(reduceCalc(input)).toBe(expected);
  });
});
