import {AsyncDuckDBConnection} from '@duckdb/duckdb-wasm';
import {DataType, Table} from 'apache-arrow';
import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

export function mapArrowTableToJsRows(table: Table): Record<string, unknown>[] {
  return table.toArray().map((row, index) => {
    const convertedRow: Record<string, unknown> = {};
    for (const [k, v] of row) {
      if (typeof v === 'bigint') {
        convertedRow[k] = Number(v);
        continue;
      }

      const field = table.schema.fields.find((field) => field.name === k);
      if (DataType.isDate(field?.type) || DataType.isTimestamp(field?.type)) {
        convertedRow[k] = typeof v === 'number' ? new Date(v) : undefined;
        continue;
      }

      convertedRow[k] = v;
    }

    // Hack so that rows always have an id
    if (!('id' in convertedRow)) {
      convertedRow['id'] = index;
    }

    return convertedRow;
  });
}

/**
 * A web component for displaying table data from a DuckDB database.
 *
 * @slot - This element has a slot
 * @csspart table - The table element
 */
@customElement('duckdb-grid-table-data')
export class DuckDbGridTableData extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
    }

    .data-container {
      width: 100%;
      overflow-x: auto;
    }

    .table-title {
      margin-bottom: 16px;
      font-weight: bold;
      font-size: 18px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #ccc;
      min-width: 600px;
    }

    th,
    td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    th {
      background-color: #f5f5f5;
      font-weight: bold;
      border-bottom: 2px solid #ccc;
      position: sticky;
      top: 0;
    }

    tr:hover {
      background-color: #f9f9f9;
    }

    tr:nth-child(even) {
      background-color: #fafafa;
    }

    tr:nth-child(even):hover {
      background-color: #f0f0f0;
    }

    .loading {
      color: #666;
      font-style: italic;
      padding: 20px;
      text-align: center;
    }

    .error {
      color: #d32f2f;
      font-weight: bold;
      padding: 20px;
      text-align: center;
    }

    .no-table {
      color: #666;
      padding: 20px;
      text-align: center;
    }

    .no-data {
      color: #666;
      padding: 20px;
      text-align: center;
      font-style: italic;
    }

    .row-count {
      padding: 8px;
      color: #666;
      font-size: 14px;
    }

    .cell-null {
      color: #999;
      font-style: italic;
    }

    .cell-number {
      text-align: right;
    }

    .cell-date {
      color: #0066cc;
    }
  `;

  @property({type: String})
  tableName!: string;

  @property({type: Object})
  connection!: AsyncDuckDBConnection;

  @state()
  private data: Record<string, unknown>[] = [];

  @state()
  private columns: string[] = [];

  @state()
  private loading = false;

  @state()
  private error = '';

  override async connectedCallback() {
    super.connectedCallback();
    if (this.connection && this.tableName) {
      await this.fetchData();
    }
  }

  override willUpdate(changedProperties: Map<string, unknown>) {
    super.willUpdate(changedProperties);
    if (
      (changedProperties.has('connection') ||
        changedProperties.has('tableName')) &&
      this.connection &&
      this.tableName
    ) {
      this.fetchData();
    }
  }

  private async fetchData() {
    if (!this.connection) {
      this.error = 'No database connection available';
      return;
    }

    if (!this.tableName) {
      this.error = 'No table name provided';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const result = await this.connection.query(
        `SELECT * FROM ${this.tableName}`
      );

      // Convert the arrow table to JS rows using the provided function
      const jsRows = mapArrowTableToJsRows(result);
      this.data = jsRows;

      // Extract column names from the arrow table schema
      this.columns = result.schema.fields.map((field) => field.name);
    } catch (err) {
      this.error = `Failed to fetch data for table "${this.tableName}": ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
      this.data = [];
      this.columns = [];
    } finally {
      this.loading = false;
    }
  }

  private formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return String(value);
  }

  private getCellClass(value: unknown): string {
    if (value === null || value === undefined) {
      return 'cell-null';
    }

    if (value instanceof Date) {
      return 'cell-date';
    }

    if (typeof value === 'number') {
      return 'cell-number';
    }

    return '';
  }

  override render() {
    return html`
      <div class="data-container">
        ${this.loading
          ? html`<div class="loading">Loading table data...</div>`
          : this.error
          ? html`<div class="error">${this.error}</div>`
          : !this.tableName
          ? html`<div class="no-table">No table name provided</div>`
          : this.data.length === 0
          ? html`<div class="no-data">No data found in table</div>`
          : html`
              <div class="row-count">
                Showing ${this.data.length}
                row${this.data.length === 1 ? '' : 's'}
              </div>
              <table part="table">
                <thead>
                  <tr>
                    ${this.columns.map(
                      (column) => html`<th title="${column}">${column}</th>`
                    )}
                  </tr>
                </thead>
                <tbody>
                  ${this.data.map(
                    (row) => html`
                      <tr>
                        ${this.columns.map(
                          (column) => html`
                            <td
                              class="${this.getCellClass(row[column])}"
                              title="${this.formatCellValue(row[column])}"
                            >
                              ${this.formatCellValue(row[column])}
                            </td>
                          `
                        )}
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            `}
      </div>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'duckdb-grid-table-data': DuckDbGridTableData;
  }
}
