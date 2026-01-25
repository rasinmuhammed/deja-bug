# Contributing to Deja-Bug

Thank you for your interest in contributing! This document provides guidelines and best practices.

---

## Code of Conduct

Be respectful, inclusive, and professional. We're building tools for developers, by developers.

---

## Getting Started

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/YOUR_USERNAME/deja-bug.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Follow the [Setup Guide](./docs/setup.md)**

---

## Development Workflow

### Before You Code
- Check [GitHub Issues](https://github.com/yourusername/deja-bug/issues) for existing work
- Open an issue to discuss major changes
- Read [Architecture Docs](./docs/implementation_plan.md)

### Code Standards
- **TypeScript**: Use ESLint + Prettier (runs on save)
- **Python**: Follow PEP 8, use Ruff for linting
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

### Testing
- Write tests for new features
- Ensure all tests pass: `pnpm test` (extension) and `uv run pytest` (server)

---

## Pull Request Process

1. **Update documentation** if you change APIs or add features
2. **Add tests** for new functionality
3. **Run linters**: `pnpm run lint` and `uv run ruff check`
4. **Keep PRs focused**: One feature/fix per PR
5. **Write clear descriptions**: Explain what and why, not just how

### PR Template
```markdown
## Description
[What does this PR do?]

## Motivation
[Why is this change needed?]

## Testing
[How did you test this?]

## Screenshots (if UI changes)
[Add visuals]

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Commits follow conventional format
```

---

## Areas for Contribution

### 🐛 Bug Fixes
Always welcome! Please include:
- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, VS Code version, etc.)

### ✨ Features
For new features:
1. Open an issue first to discuss scope
2. Get maintainer approval before starting work
3. Follow existing patterns in codebase

### 📚 Documentation
- Fix typos, clarify confusing sections
- Add examples and tutorials
- Translate docs to other languages

### 🎨 Design/UX
- Improve extension UI
- Design better notification patterns
- Create icons and graphics

---

## Code Review Process

All PRs require:
- ✅ Passing CI/CD checks
- ✅ Maintainer review and approval
- ✅ No merge conflicts

Typical review time: 2-3 days

---

## Questions?

- **General**: [GitHub Discussions](https://github.com/yourusername/deja-bug/discussions)
- **Bugs**: [GitHub Issues](https://github.com/yourusername/deja-bug/issues)
- **Security**: Email security@yourproject.com

---

Thank you for making Deja-Bug better! 🙏
