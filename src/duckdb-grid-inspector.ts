import {AsyncDuckDBConnection} from '@duckdb/duckdb-wasm';
import {Table} from 'apache-arrow';
import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import './duckdb-grid-table-select.js';
import './duckdb-grid-table-schema.js';
import './duckdb-grid-table-data.js';

/**
 * A web component that combines table selection and schema inspection for DuckDB databases.
 * This component provides a unified interface to browse and inspect database tables.
 *
 * @csspart table-select - The table select component
 * @csspart table-schema - The table schema component
 * @csspart container - The main container
 */
@customElement('duckdb-grid-inspector')
export class DuckDbGridInspector extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      border-radius: 8px;
      background-color: #fafafa;
    }

    .inspector-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .inspector-header {
      margin-bottom: 8px;
    }

    .inspector-title {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin: 0 0 8px 0;
    }

    .inspector-description {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    .controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .table-select-container {
      flex: 1;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .view-toggle {
      display: flex;
      gap: 4px;
      background: #f0f0f0;
      border-radius: 20px;
      padding: 4px;
    }

    .view-toggle-button {
      background: none;
      border: none;
      padding: 8px 16px;
      border-radius: 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      color: #666;
    }

    .view-toggle-button:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .view-toggle-button.active {
      background: white;
      color: #333;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .content-area {
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      min-height: 200px;
    }

    duckdb-grid-table-select {
      border: none;
      padding: 0;
    }

    duckdb-grid-table-schema {
      border: none;
      padding: 0;
    }

    duckdb-grid-table-data {
      border: none;
      padding: 0;
    }

    .no-connection {
      padding: 20px;
      text-align: center;
      color: #666;
      font-style: italic;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

    .no-data {
      color: #666;
      padding: 20px;
      text-align: center;
      font-style: italic;
    }
  `;

  @property({type: Object})
  connection!: AsyncDuckDBConnection;

  @property({type: Number})
  maxRowCount = 10000;

  @state()
  private selectedTableName = '';

  @state()
  private selectedView: 'data' | 'schema' = 'data';

  @state()
  private tableState:
    | {status: 'idle'}
    | {status: 'loading'}
    | {status: 'loaded'; table: Table; totalRowCount: number}
    | {status: 'error'; error: string} = {status: 'idle'};

  private async fetchTableData() {
    if (!this.connection || !this.selectedTableName) {
      this.tableState = {status: 'idle'};
      return;
    }

    this.tableState = {status: 'loading'};

    try {
      // Get total row count
      const countResult = await this.connection.query(
        `SELECT COUNT(*) as count FROM ${this.selectedTableName}`
      );
      const totalRowCount = Number(countResult.toArray()[0].count);

      // Get limited data
      const result = await this.connection.query(
        `SELECT * FROM ${this.selectedTableName} LIMIT ${this.maxRowCount}`
      );

      this.tableState = {status: 'loaded', table: result, totalRowCount};
    } catch (err) {
      this.tableState = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  override render() {
    if (!this.connection) {
      return html`
        <div class="inspector-container" part="container">
          <div class="inspector-header">
            <h2 class="inspector-title">Database Inspector</h2>
            <p class="inspector-description">
              Browse and inspect database tables and their schemas
            </p>
          </div>
          <div class="no-connection">
            No database connection provided. Please provide a DuckDB connection
            to inspect tables.
          </div>
        </div>
      `;
    }

    return html`
      <div class="inspector-container" part="container">
        <!-- Row 1: Header -->
        <div class="inspector-header">
          <h2 class="inspector-title">Database Inspector</h2>
          <p class="inspector-description">
            Browse and inspect database tables and their schemas
          </p>
        </div>

        <!-- Row 2: Controls (Table Select + View Toggle Pills) -->
        <div class="controls-row">
          <div class="table-select-container">
            <duckdb-grid-table-select
              part="table-select"
              .connection=${this.connection}
              @table-selected=${(e: CustomEvent) => {
                this.selectedTableName = e.detail.tableName;
                this.fetchTableData();
              }}
            ></duckdb-grid-table-select>
          </div>

          <div class="view-toggle">
            <button
              class="view-toggle-button ${this.selectedView === 'data'
                ? 'active'
                : ''}"
              @click=${() => (this.selectedView = 'data')}
            >
              Data
            </button>
            <button
              class="view-toggle-button ${this.selectedView === 'schema'
                ? 'active'
                : ''}"
              @click=${() => (this.selectedView = 'schema')}
            >
              Schema
            </button>
          </div>
        </div>

        <!-- Row 3: Content Area -->
        <div class="content-area">
          ${this.selectedView === 'data'
            ? this.tableState.status === 'loading'
              ? html`<div class="loading">Loading table data...</div>`
              : this.tableState.status === 'error'
              ? html`<div class="error">${this.tableState.error}</div>`
              : this.tableState.status === 'loaded'
              ? html`
                  <duckdb-grid-table-data
                    part="table-data"
                    .table=${this.tableState.table}
                    .totalRowCount=${this.tableState.totalRowCount}
                  ></duckdb-grid-table-data>
                `
              : html`<div class="no-data">Select a table to view data</div>`
            : html`
                <duckdb-grid-table-schema
                  part="table-schema"
                  .connection=${this.connection}
                  .tableName=${this.selectedTableName}
                ></duckdb-grid-table-schema>
              `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'duckdb-grid-inspector': DuckDbGridInspector;
  }
}
