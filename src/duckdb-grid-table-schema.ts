import {AsyncDuckDBConnection} from '@duckdb/duckdb-wasm';
import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

interface SchemaColumn {
  name: string;
  type: string;
  null: string;
  key: string;
  default: string;
}

/**
 * A web component for displaying the schema of a DuckDB table.
 *
 * @slot - This element has a slot
 * @csspart table - The table element
 */
@customElement('duckdb-grid-table-schema')
export class DuckDbGridTableSchema extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
    }

    .schema-container {
      width: 100%;
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
    }

    th,
    td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background-color: #f5f5f5;
      font-weight: bold;
      border-bottom: 2px solid #ccc;
    }

    tr:hover {
      background-color: #f9f9f9;
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
  `;

  @property({type: String})
  tableName!: string;

  @property({type: Object})
  connection!: AsyncDuckDBConnection;

  @state()
  private schema: SchemaColumn[] = [];

  @state()
  private loading = false;

  @state()
  private error = '';

  override async connectedCallback() {
    super.connectedCallback();
    if (this.connection && this.tableName) {
      await this.fetchSchema();
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
      this.fetchSchema();
    }
  }

  private async fetchSchema() {
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
      const result = await this.connection.query(`DESCRIBE ${this.tableName}`);
      const rows = result.toArray();

      this.schema = rows.map((row) => ({
        name: row.column_name as string,
        type: row.column_type as string,
        null: row.null as string,
        key: row.key as string,
        default: row.default as string,
      }));
    } catch (err) {
      this.error = `Failed to fetch schema for table "${this.tableName}": ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
      this.schema = [];
    } finally {
      this.loading = false;
    }
  }

  override render() {
    return html`
      <div class="schema-container">
        ${this.tableName
          ? html`<div class="table-title">
              Schema for table: ${this.tableName}
            </div>`
          : ''}
        ${this.loading
          ? html`<div class="loading">Loading schema...</div>`
          : this.error
          ? html`<div class="error">${this.error}</div>`
          : !this.tableName
          ? html`<div class="no-table">No table name provided</div>`
          : this.schema.length === 0
          ? html`<div class="no-table">No schema information found</div>`
          : html`
              <table part="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Null</th>
                    <th>Key</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.schema.map(
                    (column) => html`
                      <tr>
                        <td>${column.name}</td>
                        <td>${column.type}</td>
                        <td>${column.null}</td>
                        <td>${column.key}</td>
                        <td>${column.default || ''}</td>
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
    'duckdb-grid-table-schema': DuckDbGridTableSchema;
  }
}
