#!/bin/bash
BASE="http://localhost:3000"
PASS=0
FAIL=0

login() {
  local email=$1 cookiefile=$2
  curl -s -c $cookiefile $BASE/api/auth/csrf > /tmp/csrf-tmp.json
  local csrf=$(node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).csrfToken))" < /tmp/csrf-tmp.json)
  curl -s -b $cookiefile -c $cookiefile -X POST "$BASE/api/auth/callback/credentials" -H "Content-Type: application/x-www-form-urlencoded" -d "csrfToken=${csrf}&email=${email}&password=password123" -o /dev/null
}

check() {
  local name=$1 expected=$2 actual=$3
  if [ "$expected" = "$actual" ]; then
    echo "  PASS: $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $name (expected=$expected, got=$actual)"
    FAIL=$((FAIL+1))
  fi
}

echo "==========================================="
echo " ServiceDesk API Integration Test"
echo "==========================================="

echo ""
echo "[Setup] Login..."
login "agent1@servicedesk.com" /tmp/t-agent.txt
login "customer1@example.com" /tmp/t-cust.txt
login "manager1@servicedesk.com" /tmp/t-mgr.txt

echo ""
echo "[T1] Unauthenticated → 401"
R=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/tickets)
check "No auth" "401" "$R"

echo ""
echo "[T2] Agent ticket list"
R=$(curl -s -b /tmp/t-agent.txt "$BASE/api/tickets" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).pagination?.total>0?'ok':'empty'))")
check "Agent sees tickets" "ok" "$R"

echo ""
echo "[T3] Create ticket"
PROJ_ID=$(curl -s -b /tmp/t-mgr.txt "$BASE/api/projects?limit=1" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.[0]?.id||'none'))")
CONTACT_ID=$(docker exec servicedesk-db psql -U postgres -d servicedesk -t -c "SELECT id FROM \"Contact\" WHERE email='customer1@example.com' LIMIT 1;" 2>/dev/null | tr -d ' \n\r')
NEW=$(curl -s -b /tmp/t-cust.txt -X POST "$BASE/api/tickets" -H "Content-Type: application/json" -d "{\"projectId\":\"$PROJ_ID\",\"requesterId\":\"$CONTACT_ID\",\"title\":\"API Test Ticket\",\"description\":\"Auto test\",\"category\":\"SERVICE_REQUEST\",\"priority\":\"MEDIUM\",\"requestedDueDate\":\"2026-04-15T00:00:00Z\"}")
NEW_ID=$(echo $NEW | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.id||'fail'))")
NEW_ST=$(echo $NEW | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.status||'fail'))")
check "Created REGISTERED" "REGISTERED" "$NEW_ST"

echo ""
echo "[T4] Accept (→ IN_PROGRESS)"
curl -s -b /tmp/t-agent.txt -X POST "$BASE/api/tickets/$NEW_ID/accept" -H "Content-Type: application/json" -d '{"actionPlan":"Test plan","plannedDueDate":"2026-04-14T00:00:00Z"}' > /dev/null
ST=$(curl -s -b /tmp/t-agent.txt "$BASE/api/tickets/$NEW_ID" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.status||'fail'))")
check "Status IN_PROGRESS" "IN_PROGRESS" "$ST"

echo ""
echo "[T5] Comment"
R=$(curl -s -b /tmp/t-agent.txt -X POST "$BASE/api/tickets/$NEW_ID/comments" -H "Content-Type: application/json" -d '{"content":"Processing","type":"PUBLIC"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.id?'ok':'fail'))")
check "Comment created" "ok" "$R"

echo ""
echo "[T6] Complete request"
curl -s -b /tmp/t-agent.txt -X POST "$BASE/api/tickets/$NEW_ID/complete" > /dev/null
ST=$(curl -s -b /tmp/t-agent.txt "$BASE/api/tickets/$NEW_ID" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.status||'fail'))")
check "COMPLETION_REQUESTED" "COMPLETION_REQUESTED" "$ST"

echo ""
echo "[T7] Reject → IN_PROGRESS"
curl -s -b /tmp/t-cust.txt -X POST "$BASE/api/tickets/$NEW_ID/reject" -H "Content-Type: application/json" -d '{"reason":"Not resolved"}' > /dev/null
ST=$(curl -s -b /tmp/t-cust.txt "$BASE/api/tickets/$NEW_ID" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.status||'fail'))")
check "Back to IN_PROGRESS" "IN_PROGRESS" "$ST"

echo ""
echo "[T8] Postpone (1st)"
R=$(curl -s -b /tmp/t-agent.txt -X POST "$BASE/api/tickets/$NEW_ID/postpone" -H "Content-Type: application/json" -d '{"requestedDueDate":"2026-04-20T00:00:00Z","reason":"Need more time"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.success?'ok':JSON.parse(d).error?.code||'fail'))")
check "Postpone OK" "ok" "$R"

echo ""
echo "[T9] Approve postponement"
curl -s -b /tmp/t-cust.txt -X POST "$BASE/api/tickets/$NEW_ID/approve-postponement" > /dev/null
ST=$(curl -s -b /tmp/t-cust.txt "$BASE/api/tickets/$NEW_ID" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.status||'fail'))")
check "Back IN_PROGRESS" "IN_PROGRESS" "$ST"

echo ""
echo "[T10] Postpone 2nd → BLOCKED"
R=$(curl -s -b /tmp/t-agent.txt -X POST "$BASE/api/tickets/$NEW_ID/postpone" -H "Content-Type: application/json" -d '{"requestedDueDate":"2026-04-25T00:00:00Z","reason":"Again"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).error?.code||'unexpected'))")
check "2nd postpone blocked" "POSTPONEMENT_LIMIT_EXCEEDED" "$R"

echo ""
echo "[T11] Complete → Approve → CSAT → CLOSED"
curl -s -b /tmp/t-agent.txt -X POST "$BASE/api/tickets/$NEW_ID/complete" > /dev/null
curl -s -b /tmp/t-cust.txt -X POST "$BASE/api/tickets/$NEW_ID/approve" > /dev/null
curl -s -b /tmp/t-cust.txt -X POST "$BASE/api/tickets/$NEW_ID/csat" -H "Content-Type: application/json" -d '{"rating":5,"feedback":"Great"}' > /dev/null
ST=$(curl -s -b /tmp/t-cust.txt "$BASE/api/tickets/$NEW_ID" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.status||'fail'))")
check "Final CLOSED" "CLOSED" "$ST"
CSAT=$(curl -s -b /tmp/t-cust.txt "$BASE/api/tickets/$NEW_ID" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.csatRating?.rating||0))")
check "CSAT saved" "5" "$CSAT"

echo ""
echo "[T12] Manager dashboard"
R=$(curl -s -b /tmp/t-mgr.txt "$BASE/api/dashboard/manager" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?'ok':'fail'))")
check "Dashboard data" "ok" "$R"

echo ""
echo "[T13] CSAT summary"
R=$(curl -s -b /tmp/t-mgr.txt "$BASE/api/csat" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.summary?'ok':'fail'))")
check "CSAT summary" "ok" "$R"

echo ""
echo "[T14] SLA report"
R=$(curl -s -b /tmp/t-mgr.txt "$BASE/api/reports/sla" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.summary?'ok':'fail'))")
check "SLA report" "ok" "$R"

echo ""
echo "==========================================="
printf " Results: %d PASSED, %d FAILED\n" $PASS $FAIL
echo "==========================================="
