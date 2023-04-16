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

const matchStringOrRegExp = (test: string | RegExp, target: string) =>
  (typeof test === 'string') ? test === target : test.test(target);

export { decomposePackageNameVersion, matchStringOrRegExp };
