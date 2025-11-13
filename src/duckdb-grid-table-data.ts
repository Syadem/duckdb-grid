import {Table} from 'apache-arrow';
import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {mapArrowTableToJsRows} from './mapArrowTableToJsRows';

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

  @property({type: Object})
  table: Table | null = null;

  @property({type: Number})
  totalRowCount: number | null = null;

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
        ${!this.table
          ? html`<div class="no-data">No table data available</div>`
          : (() => {
              const jsRows = mapArrowTableToJsRows(this.table);
              const columns = this.table.schema.fields.map(
                (field) => field.name
              );
              const displayedRows = jsRows.length;
              const totalRows = this.totalRowCount ?? displayedRows;
              const isTruncated = displayedRows < totalRows;

              return html`
                <div class="row-count">
                  ${isTruncated
                    ? `Showing ${displayedRows} rows out of ${totalRows}`
                    : `Showing ${displayedRows} row${
                        displayedRows === 1 ? '' : 's'
                      }`}
                </div>
                <table part="table">
                  <thead>
                    <tr>
                      ${columns.map(
                        (column) => html`<th title="${column}">${column}</th>`
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    ${jsRows.map(
                      (row) => html`
                        <tr>
                          ${columns.map(
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
              `;
            })()}
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
