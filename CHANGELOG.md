## [1.5.6](https://github.com/alrayyes/washy-washy-core/compare/v1.5.5...v1.5.6) (2026-09-11)

### Bug Fixes

* **deps:** pin typescript to 6.0.3, TypeDoc's last supported major ([#80](https://github.com/alrayyes/washy-washy-core/issues/80)) ([c8d1896](https://github.com/alrayyes/washy-washy-core/commit/c8d1896f8bd36a0477e7ab64cdf3c0c019e56cbe)), closes [TypeStrong/typedoc#3098](https://github.com/TypeStrong/typedoc/issues/3098) [#76](https://github.com/alrayyes/washy-washy-core/issues/76)

## [1.5.5](https://github.com/alrayyes/washy-washy-core/compare/v1.5.4...v1.5.5) (2026-09-11)

### Bug Fixes

* **deps:** revert conventional-changelog-conventionalcommits to 9.3.1 ([#79](https://github.com/alrayyes/washy-washy-core/issues/79)) ([063f6ce](https://github.com/alrayyes/washy-washy-core/commit/063f6ce486c11ca96c174479f98f59f40590bbc2)), closes [conventional-changelog/conventional-changelog#1495](https://github.com/conventional-changelog/conventional-changelog/issues/1495) [#77](https://github.com/alrayyes/washy-washy-core/issues/77)
* **templates:** use GitHub's standard labels, not kind/+topic/ ([#70](https://github.com/alrayyes/washy-washy-core/issues/70)) ([49fee04](https://github.com/alrayyes/washy-washy-core/commit/49fee04082332ecebfa9c5b1cd81dca825ba7eb8)), closes [#40](https://github.com/alrayyes/washy-washy-core/issues/40) [#65](https://github.com/alrayyes/washy-washy-core/issues/65)

## [1.5.4](https://github.com/alrayyes/washy-washy-core/compare/v1.5.3...v1.5.4) (2026-09-10)

### Bug Fixes

* **ci:** correct report-type to report_type ([#59](https://github.com/alrayyes/washy-washy-core/issues/59)) ([b833afe](https://github.com/alrayyes/washy-washy-core/commit/b833afe255b41290d84730b693f45d945b012622))

## [1.5.3](https://github.com/alrayyes/washy-washy-core/compare/v1.5.2...v1.5.3) (2026-09-09)

### Bug Fixes

* **deps:** downgrade bun.lock to lockfileVersion 1 for Dependabot ([#55](https://github.com/alrayyes/washy-washy-core/issues/55)) ([4b94c69](https://github.com/alrayyes/washy-washy-core/commit/4b94c6957c5523c14aba75d6b8b6898a486d421f))

## [1.5.2](https://github.com/alrayyes/washy-washy-core/compare/v1.5.1...v1.5.2) (2026-09-09)

### Bug Fixes

* **deps:** bump js-yaml to 4.3.2 for GHSA-2883-xcg3-v3hh ([#54](https://github.com/alrayyes/washy-washy-core/issues/54)) ([1632c12](https://github.com/alrayyes/washy-washy-core/commit/1632c127f48582e9677753734bf0ced7296727f2))

## [1.5.1](https://github.com/alrayyes/washy-washy-core/compare/v1.5.0...v1.5.1) (2026-09-09)

### Bug Fixes

* **ci:** don't fail Dependabot PRs on a tokenless Codecov upload ([#53](https://github.com/alrayyes/washy-washy-core/issues/53)) ([132d87d](https://github.com/alrayyes/washy-washy-core/commit/132d87d638d11660045530c642e7cb15d8572412)), closes [#52](https://github.com/alrayyes/washy-washy-core/issues/52) [#54](https://github.com/alrayyes/washy-washy-core/issues/54)

## [1.5.0](https://github.com/alrayyes/washy-washy-core/compare/v1.4.1...v1.5.0) (2026-08-30)

### Features

* export washer array-field length caps as named constants ([#39](https://github.com/alrayyes/washy-washy-core/issues/39)) ([0fa1a50](https://github.com/alrayyes/washy-washy-core/commit/0fa1a502a822e49517773b9ab24c766cd58077ac)), closes [#34](https://github.com/alrayyes/washy-washy-core/issues/34)

### Bug Fixes

* **tooling:** exclude docs-site from biome check ([#38](https://github.com/alrayyes/washy-washy-core/issues/38)) ([a7d3561](https://github.com/alrayyes/washy-washy-core/commit/a7d35611d94d96636f90491c174b044833642895)), closes [#31](https://github.com/alrayyes/washy-washy-core/issues/31)

## [1.4.1](https://github.com/alrayyes/washy-washy-core/compare/v1.4.0...v1.4.1) (2026-08-25)

### Bug Fixes

* widen four text-length caps that real content exceeds ([#36](https://github.com/alrayyes/washy-washy-core/issues/36)) ([3cdcd5a](https://github.com/alrayyes/washy-washy-core/commit/3cdcd5af0e724b0516e74739264d6a07c999904f)), closes [#35](https://github.com/alrayyes/washy-washy-core/issues/35)

## [1.4.0](https://github.com/alrayyes/washy-washy-core/compare/v1.3.1...v1.4.0) (2026-08-25)

### Features

* cap text-field lengths to avoid PDF rendering issues ([#33](https://github.com/alrayyes/washy-washy-core/issues/33)) ([5eac643](https://github.com/alrayyes/washy-washy-core/commit/5eac6435708b3e4995375bc717a13022e140ff23)), closes [#32](https://github.com/alrayyes/washy-washy-core/issues/32)

## [1.3.1](https://github.com/alrayyes/washy-washy-core/compare/v1.3.0...v1.3.1) (2026-08-23)

### Bug Fixes

* validate the duration field's shape in instructionsFromRows ([#28](https://github.com/alrayyes/washy-washy-core/issues/28)) ([47ce9c9](https://github.com/alrayyes/washy-washy-core/commit/47ce9c9607c7c4148a0ceb775a8adfad79df1275))

## [1.3.0](https://github.com/alrayyes/washy-washy-core/compare/v1.2.0...v1.3.0) (2026-08-22)

### Features

* add an optional reference name and link to each chart row ([#25](https://github.com/alrayyes/washy-washy-core/issues/25)) ([3c71116](https://github.com/alrayyes/washy-washy-core/commit/3c7111682bacf4b87f7bc4299a6f127b1db2af9c))

### Bug Fixes

* teach LTeX the hyphenated compounds and serializer it flags ([#26](https://github.com/alrayyes/washy-washy-core/issues/26)) ([b3ec853](https://github.com/alrayyes/washy-washy-core/commit/b3ec8530ed7728358f03bdb358d6cdf2085ce701)), closes [#24](https://github.com/alrayyes/washy-washy-core/issues/24)

## [1.2.0](https://github.com/alrayyes/washy-washy-core/compare/v1.1.0...v1.2.0) (2026-08-22)

### Features

* generate and embed a JSON Schema for the combined config ([#23](https://github.com/alrayyes/washy-washy-core/issues/23)) ([c8924c1](https://github.com/alrayyes/washy-washy-core/commit/c8924c1278e615bb7d0de7aa84acbe3e03703323))

## [1.1.0](https://github.com/alrayyes/washy-washy-core/compare/v1.0.0...v1.1.0) (2026-08-22)

### Features

* add combined machine+chart config parsing ([#15](https://github.com/alrayyes/washy-washy-core/issues/15)) ([304d5aa](https://github.com/alrayyes/washy-washy-core/commit/304d5aa02a3d61ce880cfcc8588b90f0a65e1826)), closes [#14](https://github.com/alrayyes/washy-washy-core/issues/14)

## 1.0.0 (2026-08-22)

### Features

* import chart parsing, machine validation, and mixing logic ([#3](https://github.com/alrayyes/washy-washy-core/issues/3)) ([8c0d0c7](https://github.com/alrayyes/washy-washy-core/commit/8c0d0c7652d3567f8b0becb4d4ec3fba50907a6c)), closes [#2](https://github.com/alrayyes/washy-washy-core/issues/2)
