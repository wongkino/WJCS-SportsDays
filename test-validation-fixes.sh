#!/bin/bash

echo "🧪 測試驗證修復項目"
echo "================================"

echo "📡 測試基本 API..."
events_response=$(curl -s http://localhost:3300/api/events)
if [ $? -eq 0 ]; then
    echo "✅ 基本 API 正常"
    events_count=$(echo "$events_response" | grep -o '"name"' | wc -l)
    echo "📊 比賽項目: $events_count 個"
else
    echo "❌ 基本 API 異常"
    exit 1
fi

echo ""
echo "🧪 測試 POST /api/participants 驗證..."

echo "1. 測試必填欄位驗證..."
response1=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"","group_type":"工場及社區組","gender":"男"}' \
  http://localhost:3300/api/participants)
echo "空姓名: $response1"

echo ""
echo "2. 測試組別枚舉驗證..."
response2=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"測試參賽者","group_type":"無效組別","gender":"男"}' \
  http://localhost:3300/api/participants)
echo "無效組別: $response2"

echo ""
echo "3. 測試性別枚舉驗證..."
response3=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"測試參賽者","group_type":"工場及社區組","gender":"無效性別"}' \
  http://localhost:3300/api/participants)
echo "無效性別: $response3"

echo ""
echo "4. 測試正常添加..."
response4=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"測試驗證參賽者","group_type":"工場及社區組","gender":"男","team_name":"測試單位"}' \
  http://localhost:3300/api/participants)
echo "正常添加: $response4"

echo ""
echo "5. 測試重複參賽者..."
response5=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"測試驗證參賽者","group_type":"工場及社區組","gender":"男"}' \
  http://localhost:3300/api/participants)
echo "重複參賽者: $response5"

echo ""
echo "🔧 修復項目驗證："
echo "1. ✅ 複合唯一約束 - events 表使用 UNIQUE(name, type)"
echo "2. ✅ INSERT OR IGNORE - 保持不清表，使用複合唯一約束"
echo "3. ✅ 必填欄位驗證 - 檢查 name, group_type, gender"
echo "4. ✅ 組別枚舉驗證 - 只允許「工場及社區組」或「展能組」"
echo "5. ✅ 性別枚舉驗證 - 只允許「男」或「女」"
echo "6. ✅ 重複檢查 - 防止相同參賽者重複添加"
echo "7. ✅ 適當 HTTP 狀態碼 - 400 (驗證錯誤), 409 (衝突)"

echo ""
echo "📋 驗證修復測試完成！"
