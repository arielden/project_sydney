#!/bin/bash
# Setup Jest and testing dependencies

echo "Installing Jest and testing dependencies..."
npm install --save-dev jest @types/jest ts-jest typescript

echo "✓ Jest setup complete!"
echo ""
echo "To run tests:"
echo "  npm test                 # Run all tests"
echo "  npm test -- --watch     # Watch mode"
echo "  npm test -- --coverage  # With coverage report"
