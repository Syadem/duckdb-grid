import {AsyncDuckDBConnection} from '@duckdb/duckdb-wasm';
import {Table} from 'apache-arrow';
import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import './duckdb-grid-table-data.js';

/**
 * A web component for executing SQL queries and displaying results.
 *
 * @slot - This element has a slot
 * @csspart textarea - The query input textarea
 * @csspart button - The execute button
 * @csspart results - The results container
 */
@customElement('duckdb-grid-query-executor')
export class DuckDbGridQueryExecutor extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      border-radius: 8px;
      background-color: #fafafa;
    }

    .executor-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .query-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .query-label {
      font-weight: bold;
      font-size: 14px;
      color: #333;
    }

    textarea {
      min-height: 100px;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      resize: vertical;
      background-color: white;
    }

    .button-row {
      display: flex;
      justify-content: flex-end;
    }

    button {
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }

    button:hover {
      background-color: #0056b3;
    }

    button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .results-container {
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 16px;
      min-height: 200px;
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

    .no-connection {
      color: #666;
      padding: 20px;
      text-align: center;
      font-style: italic;
    }

    .no-query {
      color: #666;
      padding: 20px;
      text-align: center;
      font-style: italic;
    }

    .execution-time {
      padding: 8px;
      color: #666;
      font-size: 12px;
      text-align: right;
    }

    duckdb-grid-table-data {
      border: none;
      padding: 0;
    }
  `;

  @property({type: Object})
  connection!: AsyncDuckDBConnection;

  @state()
  private query = '';

  @state()
  private queryState:
    | {status: 'idle'}
    | {status: 'loading'}
    | {status: 'loaded'; table: Table; executionTime: number}
    | {status: 'error'; error: string} = {status: 'idle'};

  private async executeQuery() {
    if (!this.connection) {
      this.queryState = {
        status: 'error',
        error: 'No database connection available',
      };
      return;
    }

    if (!this.query.trim()) {
      this.queryState = {status: 'error', error: 'Please enter a SQL query'};
      return;
    }

    this.queryState = {status: 'loading'};
    const startTime = Date.now();

    try {
      const result = await this.connection.query(this.query.trim());
      const executionTime = Date.now() - startTime;
      this.queryState = {status: 'loaded', table: result, executionTime};
    } catch (err) {
      this.queryState = {
        status: 'error',
        error: `Query execution failed: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
      };
    }
  }

  private handleQueryInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.query = target.value;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.executeQuery();
    }
  }

  override render() {
    return html`
      <div class="executor-container">
        <!-- Row 1: Query Input -->
        <div class="query-row">
          <label class="query-label" for="query-textarea">SQL Query</label>
          <textarea
            id="query-textarea"
            part="textarea"
            .value=${this.query}
            @input=${this.handleQueryInput}
            @keydown=${this.handleKeyDown}
            placeholder="Enter your SQL query here... (Ctrl+Enter to execute)"
          ></textarea>
        </div>

        <!-- Row 2: Execute Button -->
        <div class="button-row">
          <button
            part="button"
            @click=${this.executeQuery}
            ?disabled=${this.queryState.status === 'loading' ||
            !this.connection}
          >
            ${this.queryState.status === 'loading'
              ? 'Executing...'
              : 'Run Query'}
          </button>
        </div>

        <!-- Row 3: Results -->
        <div class="results-container" part="results">
          ${!this.connection
            ? html`<div class="no-connection">
                No database connection provided. Please provide a DuckDB
                connection to execute queries.
              </div>`
            : this.queryState.status === 'loading'
            ? html`<div class="loading">Executing query...</div>`
            : this.queryState.status === 'error'
            ? html`<div class="error">${this.queryState.error}</div>`
            : this.queryState.status === 'loaded'
            ? html`
                ${this.queryState.executionTime !== null
                  ? html`<div class="execution-time">
                      Executed in ${this.queryState.executionTime}ms
                    </div>`
                  : ''}
                <duckdb-grid-table-data
                  .table=${this.queryState.table}
                ></duckdb-grid-table-data>
              `
            : html`<div class="no-query">
                Enter a query above and click "Run Query" to see results
              </div>`}
        </div>
      </div>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'duckdb-grid-query-executor': DuckDbGridQueryExecutor;
  }
}
