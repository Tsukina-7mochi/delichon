/**
 * @example "package@version" -> ["package", "version"]
 * @example "package" -> ["package", ""]
 * @example "@author/package@version" -> ["@author/package", "version"]
 * @example "@author/package" -> ["@author/package"]
 */
const decomposePackageNameVersion = function (
  pkgStr: string,
): [string, string] {
  const index = pkgStr.lastIndexOf('@');
  if (index <= 0) {
    return [pkgStr, ''];
  } else {
    return [pkgStr.slice(0, index), pkgStr.slice(index + 1)];
  }
};

const buildTableString = function (table: string[][], headSeparator = false) {
  // deno-lint-ignore no-control-regex
  const ansiEscRegExp = /\x1b\[\d+(;\d+)*m/g;
  const rowNum = table.reduce(
    (max, row) => max >= row.length ? max : row.length,
    0,
  );

  const lengthMapTranspose: number[][] = new Array(rowNum).fill(0).map(() =>
    new Array(table.length).fill(0)
  );
  const ansiEscLengthMap: number[][] = new Array(table.length).fill(0).map(() =>
    new Array(rowNum).fill(0)
  );
  table.forEach((row, i) =>
    row.forEach((cell, j) => {
      const lenWithoutAnsiEsc = cell.replace(ansiEscRegExp, '').length;
      lengthMapTranspose[j][i] = lenWithoutAnsiEsc;
      ansiEscLengthMap[i][j] = cell.length - lenWithoutAnsiEsc;
    })
  );

  const rowWidths = lengthMapTranspose.map((lengths) => {
    return lengths.reduce((max, len) => max >= len ? max : len);
  });
  const paddedTable = table.map((row, i) =>
    row.map((cell, j) => {
      return (cell + (' '.repeat(rowWidths[j]))).slice(
        0,
        rowWidths[j] + ansiEscLengthMap[i][j],
      );
    })
  );
  if (headSeparator) {
    paddedTable.splice(1, 0, rowWidths.map((width) => '-'.repeat(width)));
  }

  return paddedTable.map((row) => row.join(' ')).join('\n');
};

export { buildTableString, decomposePackageNameVersion };
