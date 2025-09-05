/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {DuckDbGridTableSelect} from '../duckdb-grid-table-select.js';

import {assert, fixture} from '@open-wc/testing';
import {html} from 'lit/static-html.js';

suite('duckdb-grid-table-select', () => {
  test('is defined', () => {
    const el = document.createElement('duckdb-grid-table-select');
    assert.instanceOf(el, DuckDbGridTableSelect);
  });

  test('renders with default values', async () => {
    const el = await fixture(
      html`<duckdb-grid-table-select></duckdb-grid-table-select>`
    );
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, World!</h1>
      <button part="button">Click Count: 0</button>
      <slot></slot>
    `
    );
  });

  test('renders with a set name', async () => {
    const el = await fixture(
      html`<duckdb-grid-table-select name="Test"></duckdb-grid-table-select>`
    );
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, Test!</h1>
      <button part="button">Click Count: 0</button>
      <slot></slot>
    `
    );
  });

  test('handles a click', async () => {
    const el = (await fixture(
      html`<duckdb-grid-table-select></duckdb-grid-table-select>`
    )) as DuckDbGridTableSelect;
    const button = el.shadowRoot!.querySelector('button')!;
    button.click();
    await el.updateComplete;
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, World!</h1>
      <button part="button">Click Count: 1</button>
      <slot></slot>
    `
    );
  });

  test('styling applied', async () => {
    const el = (await fixture(
      html`<duckdb-grid-table-select></duckdb-grid-table-select>`
    )) as DuckDbGridTableSelect;
    await el.updateComplete;
    assert.equal(getComputedStyle(el).paddingTop, '16px');
  });
});
