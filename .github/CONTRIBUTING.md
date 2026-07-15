# Contributing to CrossBan

Thank you for your interest in contributing to CrossBan! This document outlines the guidelines for contributing to this open-source Discord bot project.

## Code of Conduct

We follow a simple code of conduct: Be respectful, inclusive, and constructive in all interactions. Harassment, discriminatory behavior, and political discussions will not be tolerated.

## How to Contribute

1. **Fork the Repository**: Create a fork of the [CrossBan repository](https://github.com/The-LukeZ/CrossBan) on GitHub.

2. **Create a Branch**: Work on a new branch for your changes (e.g., `feature/new-feature` or `bugfix/issue-fix`).

3. **Make Changes**: Ensure your code adheres to the project's standards (see below).

4. **Test Your Changes**: Run tests and verify functionality. CrossBan uses TypeScript, PostgreSQL 17, and is Dockerized—refer to the [Wiki](https://github.com/The-LukeZ/CrossBan/wiki) for setup.

5. **Submit a Pull Request**: Open a PR with a clear description of your changes. Reference any related issues.

6. **Review Process**: Maintainers will review your PR. Be open to feedback and make necessary revisions.

## Development Setup

- Clone the repository and follow the setup instructions in the [Wiki](https://github.com/The-LukeZ/CrossBan/wiki).
- Use Node.js and Docker for local development, as well as pnpm for package management.
- Ensure PostgreSQL 17 is running via Docker.

## Coding Standards

- Write code in TypeScript.
- Follow standard JavaScript/TypeScript conventions (Use [Prettier](https://prettier.io/) for code formatting).

  - You can run `pnpm format` to format your code with prettier. It uses the configuration in [`.prettierrc`](/.prettierrc).
  - Always use Components V2 - only use embeds where necessary (because of authors/headers/fields).

- Use meaningful commit messages. (e.g., `feat: add <new feature>`, `fix: resolve issue #123`).
- Keep code modular and well-documented. (Use JSDoc comments where appropriate).

## Reporting Issues

- Use GitHub Issues to report bugs or suggest features.
- Provide detailed steps to reproduce bugs, including environment details.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it privately by emailing the project maintainer at [crossban@supportmail.dev](mailto:crossban@supportmail.dev). Do not create a public issue for security vulnerabilities.

## License

All contributions must comply with the **PolyForm Noncommercial License 1.0.0**. You may not use this project or contributions for commercial purposes or to make money. By contributing, you agree to license your changes under the same license.

If you have questions, feel free to open an issue or discuss in a PR.
