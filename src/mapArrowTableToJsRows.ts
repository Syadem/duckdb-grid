import {DataType, Table} from 'apache-arrow';

export function mapArrowTableToJsRows(table: Table): Record<string, unknown>[] {
  return table.toArray().map((row, index) => {
    const convertedRow: Record<string, unknown> = {};
    for (const [k, v] of row) {
      if (typeof v === 'bigint') {
        convertedRow[k] = Number(v);
        continue;
      }

      const field = table.schema.fields.find((field) => field.name === k);
      if (DataType.isDate(field?.type)) {
        convertedRow[k] =
          typeof v === 'number'
            ? new Date(v).toISOString().split('T')[0]
            : undefined;
        continue;
      } else if (DataType.isTimestamp(field?.type)) {
        convertedRow[k] =
          typeof v === 'number' ? new Date(v).toISOString() : undefined;
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
