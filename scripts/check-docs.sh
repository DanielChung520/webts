#!/bin/bash

echo "開始檢查文檔..."

# 檢查是否有未完成的標記
echo "檢查未完成標記..."
grep -r "TODO\|FIXME\|XXX" docs/

# 檢查無效的 Markdown 連結
echo "檢查無效連結..."
find docs/ -name "*.md" -exec grep -l "\[.*\](.*))" {} \;

# 檢查最後更新日期
echo "檢查過期文檔..."
find docs/ -name "*.md" -mtime +30 -exec echo "警告: {} 已超過30天未更新" \;

# 檢查必要的文檔是否存在
echo "檢查必要文檔..."
required_docs=("api.md" "README.md" "development.md" "deployment.md")
for doc in "${required_docs[@]}"; do
    if [ ! -f "docs/$doc" ]; then
        echo "錯誤: 缺少必要文檔 $doc"
    fi
done

echo "文檔檢查完成！" 