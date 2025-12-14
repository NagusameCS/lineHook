# Contributing to LineHook

Thank you for your interest in contributing! 🎉

## Ways to Contribute

### 🐛 Report Bugs
- Use the bug report issue template
- Include your workflow configuration
- Add relevant logs from the Actions tab

### 💡 Suggest Features
- Use the feature request issue template
- Explain the use case and why it would be helpful

### 🔧 Submit Pull Requests

1. **Fork the repository**

2. **Create a branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Test locally if possible
   - Update documentation if needed

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add support for X"
   ```

5. **Push and create a PR**
   ```bash
   git push origin feature/my-new-feature
   ```

## Development

### Testing Locally

You can test the line counting logic locally:

```bash
# Count lines in current directory
find . -type f -not -path './.git/*' | while read file; do
  if file "$file" | grep -q text; then
    wc -l "$file"
  fi
done | awk '{sum += $1} END {print sum}'
```

### Action Structure

- `action.yml` - Main action definition with all inputs, outputs, and run logic
- `examples/` - Example workflow files for different use cases
- `README.md` - Documentation

## Code Style

- Use descriptive variable names
- Add comments for complex logic
- Keep bash scripts POSIX-compatible where possible

## Questions?

Feel free to open an issue if you have questions!
