# Arapey

This is the [Eleventy-based](https://www.11ty.dev/) specimen site for the Arapey variable font by Eduardo Tunni. It was developed by Marciano Schildmeijer and Roel Nieskens at Kabisa. It was built using the [Specimen Skeleton](https://github.com/kabisa/specimen-skeleton).

## Project setup & development

This project requires Node.js >= 12 and [yarn](https://yarnpkg.com/).

To get started, run the following commands from the root of the repo:

- `yarn install`
- `yarn fontdata` - Only needed on first run. This will (re)generate data files for the font in `src/fonts`.
- `yarn start` - This will start the local development server, view at http://localhost:8080.

The site will [automatically](./.github/workflows/ci.yml) be re-built and deployed on Github Pages every time the master branch is updated.
