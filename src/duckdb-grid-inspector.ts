import {AsyncDuckDBConnection} from '@duckdb/duckdb-wasm';
import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import './duckdb-grid-table-select.js';
import './duckdb-grid-table-schema.js';

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

    .table-select-section {
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .table-schema-section {
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    duckdb-grid-table-select {
      border: none;
      padding: 0;
    }

    duckdb-grid-table-schema {
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

    @media (min-width: 768px) {
      .inspector-container {
        flex-direction: row;
        align-items: flex-start;
      }

      .table-select-section {
        flex: 0 0 300px;
      }

      .table-schema-section {
        flex: 1;
      }
    }
  `;

  @property({type: Object})
  connection!: AsyncDuckDBConnection;

  @state()
  private selectedTableName = '';

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
        <div class="inspector-header">
          <h2 class="inspector-title">Database Inspector</h2>
          <p class="inspector-description">
            Browse and inspect database tables and their schemas
          </p>
        </div>

        <div class="table-select-section">
          <duckdb-grid-table-select
            part="table-select"
            .connection=${this.connection}
            @table-selected=${(e: CustomEvent) => {
              this.selectedTableName = e.detail.tableName;
            }}
          ></duckdb-grid-table-select>
        </div>

        <div class="table-schema-section">
          <duckdb-grid-table-schema
            part="table-schema"
            .connection=${this.connection}
            .tableName=${this.selectedTableName}
          ></duckdb-grid-table-schema>
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
