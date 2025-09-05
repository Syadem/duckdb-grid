/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AsyncDuckDBConnection} from '@duckdb/duckdb-wasm';
import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

/**
 * A web component for selecting tables from a DuckDB database.
 *
 * @fires table-selected - Indicates when a table is selected
 * @slot - This element has a slot
 * @csspart select - The select element
 */
@customElement('duckdb-grid-table-select')
export class DuckDbGridTableSelect extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
    }

    .table-select-container {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    }

    select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }

    .loading {
      color: #666;
      font-style: italic;
    }

    .error {
      color: #d32f2f;
      font-weight: bold;
    }

    .no-tables {
      color: #666;
    }
  `;

  @property({type: Object})
  connection!: AsyncDuckDBConnection;

  @state()
  private tables: string[] = [];

  @state()
  private selectedTable = '';

  @state()
  private loading = false;

  @state()
  private error = '';

  override async connectedCallback() {
    super.connectedCallback();
    if (this.connection) {
      await this.fetchTables();
    }
  }

  override willUpdate(changedProperties: Map<string, unknown>) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('connection') && this.connection) {
      this.fetchTables();
    }
  }

  private async fetchTables() {
    if (!this.connection) {
      this.error = 'No database connection available';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const result = await this.connection.query('SHOW TABLES');
      const tableNames: string[] = [];

      for (let i = 0; i < result.numRows; i++) {
        const tableName = result.getChild('name')?.get(i);
        if (tableName) {
          tableNames.push(tableName.toString());
        }
      }

      this.tables = tableNames;

      // Auto-select first table if none selected
      if (this.tables.length > 0 && !this.selectedTable) {
        this.selectedTable = this.tables[0];
        this._dispatchTableSelected();
      }
    } catch (err) {
      this.error = `Failed to fetch tables: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
      this.tables = [];
    } finally {
      this.loading = false;
    }
  }

  private _onTableChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.selectedTable = select.value;
    this._dispatchTableSelected();
  }

  private _dispatchTableSelected() {
    this.dispatchEvent(
      new CustomEvent('table-selected', {
        detail: {tableName: this.selectedTable},
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <div class="table-select-container">
        <label for="table-select">Select Table:</label>

        ${this.loading
          ? html`<div class="loading">Loading tables...</div>`
          : this.error
          ? html`<div class="error">${this.error}</div>`
          : this.tables.length === 0
          ? html`<div class="no-tables">No tables found in database</div>`
          : html`
              <select
                id="table-select"
                part="select"
                .value=${this.selectedTable}
                @change=${this._onTableChange}
              >
                ${this.tables.map(
                  (table) => html`
                    <option
                      value=${table}
                      ?selected=${table === this.selectedTable}
                    >
                      ${table}
                    </option>
                  `
                )}
              </select>
            `}
      </div>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'duckdb-grid-table-select': DuckDbGridTableSelect;
  }
}
