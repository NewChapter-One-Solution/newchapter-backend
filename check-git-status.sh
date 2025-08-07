#!/bin/bash

echo "🔍 Checking Git status for missing files..."
echo ""

echo "📁 Current Git status:"
git status

echo ""
echo "📋 Checking if utilityFunctions.ts is tracked:"
git ls-files src/utils/utilityFunctions.ts || echo "❌ utilityFunctions.ts is NOT tracked by Git"

echo ""
echo "📋 All files in src/utils/:"
ls -la src/utils/

echo ""
echo "📋 Git tracked files in src/utils/:"
git ls-files src/utils/

echo ""
echo "🔧 To fix missing files, run:"
echo "git add ."
echo "git commit -m 'Add missing utility functions'"
echo "git push origin main"