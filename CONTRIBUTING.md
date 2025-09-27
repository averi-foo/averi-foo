# Contributing

## LICENSE

See [LICENSE](https://github.com/averi-foo/averi-foo/blob/main/LICENSE)

## Making changes

For simplicity and speed, this project follows the GitHub flow model
https://docs.github.com/en/get-started/using-github/github-flow.
The code running on the server lives in the main branch. 

### GitHub

Please hide your identity. Go into settings, and verify your username or email 
don't contain any identifiable information. 
In email settings, make sure `Keep my email addresses private` and `Block command line pushes that expose my email`  are checked.

### Making a pull request

Fork https://github.com/averi-foo/averi-foo on GitHub and clone your fork locally.
Inside the repo run

```bash
git remote add upstream https://github.com/averi-foo/averi-foo
git branch --set-upstream-to=upstream/main main
git pull
```

This will set up your fork's `main` branch to stay 1:1 copy of averifoo's `main`
branch. If you want to make a change, in your fork repo create a branch `my-cool-feature`
from your fork's main, when you are finished, create a pull request to averi-foo
`yourfork/my-cool-feature` -> `averi-foo/main`. Do not make the changes into fork's
`main` branch because it should always be a 1:1 copy of `averi-foo/main`.

Always test your changes.

### Tips

To avoid merge conflicts, periodically pull/fetch on your fork's `main` branch.
Then rebase your feature branch and resolve conflicts. This will help fix them on the
spot.

When peforming risky actions, for example rebase/resolving conflicts, first always 
create a backup of your feature branch before.

## Coding style

  - Tab indentation
    - Switch cases indented 1 level
    - Member expressions indented 1 level
    - Comment indentation ignored
  - Unix linebreaks
  - Single quotes
  - Always include semicolon

ESLint will enforce this (and pick up some other minor code issues). Run ESLint:

```bash
#whole project
eslint ./

#specific directory/file
eslint /path/to/whatever
```

## Running tests

Make sure these still pass after your changes, or adjust them to meet the new expected results.

There is a "jschan-test" service in the `docker-compose.yml` file that will run all the tests in a jschan instance using the docker instance. See the advanced section of installation for some instruction on how to use this.

You can also Run them locally if you have an instance setup (or for quickly running unit tests):

```bash
#unit tests
npm run test
# OR npm run test:unit

#integration tests
TEST_ADMIN_PASSWORD=<password from jschan-reset docker> npm run test:integration

#all tests
npm run test:all

#specific test(s)
npm run test:all <filename|regex>
```

Linting, code coverage and test results are reported in merge requests. Improvements to add tests and/or improve test coverage are welcomed.
