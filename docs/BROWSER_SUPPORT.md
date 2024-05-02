# Browser support and compatibility

We want to be explicit about what our goal around browser support is so that it is easier to manage our outputs and tests. Given the content and intended audience of the site, we aim for general browser support

## Browser support definition

Currently the definition of what browsers we aim to support are in the `.browserslistrc` which is based around the [browserslist](https://browsersl.ist/) project.

- Utilize [browsersl.ist](https://browsersl.ist/) to help see generally what percentage broadly a definition will cover.
- `npx browserslist` will output a full list of browsers from the Browserslist definition.
- Regular updating of the browserslist information is needed and can be done with `npx update-browserslist-db@latest`

## CSS

To help ensure we are outputting CSS that can work in our supported list of browsers, [autoprefixer](https://github.com/postcss/autoprefixer#readme) is installed as a plugin for PostCSS.

- To see what prefixes and similar actions will be taken by `autoprefixer` run `npx autoprefixer --info`

Some other notable PostCSS plugins:

- [postcss-nesting](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting) - Allows for the use of official nesting syntax.
- [postcss-custom-media](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-media) - Allows for the use of `@custom-media --small-viewport (max-width: 30rem);`

## Javascript

To help ensure our output CSS is compatible with our targeted browsers, we ....
