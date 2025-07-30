# 📧 EmailJS 설정 가이드 - 상담신청 자동 확인 메일

## 🎯 목표
상담신청 후 신청자에게 **자동으로 확인 이메일**을 보내는 시스템 구축

---

## 🚀 1단계: EmailJS 회원가입

### **EmailJS 사이트 접속**
```
🌐 사이트: https://www.emailjs.com/
👆 "Sign Up" 클릭하여 회원가입
```

### **계정 생성**
```
📧 이메일: admin@joycom.or.kr (또는 개인 이메일)
🔐 비밀번호: 안전한 비밀번호 설정
✅ 이메일 인증 완료
```

---

## 🔧 2단계: 이메일 서비스 연동

### **Gmail 연동 (추천)**
```
📋 단계:
1. EmailJS 대시보드 → "Email Services" 클릭
2. "Add Service" → "Gmail" 선택
3. Gmail 계정으로 로그인 허용
4. 서비스 ID 확인: service_xxxxxxx
```

### **다른 이메일 서비스**
```
📮 지원 서비스:
- Gmail ✅ (추천 - 무료)
- Outlook
- Yahoo Mail
- 기타 SMTP 서버
```

---

## 📝 3단계: 이메일 템플릿 생성

### **신청자 확인 메일 템플릿**
```
🎯 템플릿 이름: template_confirmation

📧 제목: [조이상담센터] {{to_name}}님, 상담신청이 완료되었습니다! 

📄 내용:
안녕하세요 {{to_name}}님,

🎉 조이상담코칭센터에 상담신청해주셔서 감사합니다!

📋 신청 내용 확인:
• 상담유형: {{consultation_type}}
• 상담방식: {{consultation_method}}
• 희망일시: {{preferred_date}} {{preferred_time}}
• 연락처: {{phone}}
• 신청시간: {{application_time}}

📞 연락 안내:
⏰ 24시간 내에 전화나 문자로 연락드리겠습니다.
🚨 급한 경우: 031-275-3636

📍 센터 위치:
경기도 용인시 기흥구 동백중앙로 16번길 6, 2층
(동백역 1번 출구 도보 1분)

감사합니다! 🌟

조이상담코칭센터 드림
```

---

## 🔑 4단계: API 키 발급

### **Public Key 발급**
```
📋 단계:
1. EmailJS 대시보드 → "Account" → "General"
2. "Public Key" 복사
3. 예시: user_xxxxxxxxxxxxxxxxx

⚠️ 중요: 이 키는 공개되어도 안전합니다!
```

### **Service ID 확인**
```
📋 위치:
1. "Email Services" 페이지
2. 생성한 서비스 클릭
3. Service ID 복사
4. 예시: service_xxxxxxx
```

### **Template ID 확인**
```
📋 위치:
1. "Email Templates" 페이지  
2. 생성한 템플릿 클릭
3. Template ID 복사
4. 예시: template_xxxxxxxx
```

---

## 💻 5단계: 코드에 적용

### **API 키 입력**
```javascript
// index.html 파일에서 수정할 부분

// 1. EmailJS 초기화 부분
emailjs.init("여기에_실제_PUBLIC_KEY_입력"); 

// 2. 서비스 호출 부분
await emailjs.send(
    'service_xxxxxxx',        // 실제 서비스 ID
    'template_confirmation',   // 실제 템플릿 ID
    confirmationTemplate
);
```

### **실제 적용 예시**
```javascript
// ✅ 올바른 설정 예시
emailjs.init("user_abc123def456ghi789");

await emailjs.send(
    'service_gmail_123',
    'template_confirmation_456',
    confirmationTemplate
);
```

---

## 🧪 6단계: 테스트

### **테스트 방법**
```
🎯 실제 상담신청 테스트:
1. joycom.or.kr 접속
2. 상담신청 폼 작성 (실제 이메일 입력)
3. 신청 완료
4. 이메일 수신 확인 ✅

📧 확인 사항:
- 신청자 이메일로 확인 메일 도착
- 템플릿 변수 정상 치환
- 링크 및 연락처 정확성
```

---

## 🚨 문제해결

### **이메일이 안 와요!**
```
🔍 체크리스트:
☐ Public Key 정확히 입력했나요?
☐ Service ID 정확한가요?  
☐ Template ID 정확한가요?
☐ Gmail 연동 정상인가요?
☐ 스팸함 확인했나요?
☐ 콘솔에 오류 메시지 있나요?
```

### **오류 메시지별 해결**
```
❌ "Invalid service ID"
   → Service ID 다시 확인

❌ "Template not found"  
   → Template ID 다시 확인

❌ "Daily quota exceeded"
   → 무료 플랜: 하루 200개 제한
   → 유료 플랜 업그레이드 고려
```

---

## 💰 요금 안내

### **무료 플랜**
```
📊 무료 제공:
- 월 200개 이메일
- 기본 템플릿
- Gmail/Outlook 연동

💡 조이상담센터에는 충분합니다!
```

### **유료 플랜 (필요시)**
```
💳 Personal Plan: $15/월
- 월 1,000개 이메일
- 고급 기능
- 우선 지원

🏢 Business Plan: $50/월  
- 월 10,000개 이메일
- 팀 기능
- SLA 보장
```

---

## ✨ 완료 후 혜택

### **신청자 혜택**
```
✅ 즉시 신청 확인
✅ 연락 일정 안내
✅ 센터 정보 제공
✅ 신뢰도 증가
```

### **관리자 혜택**
```
✅ 자동화된 고객 응대
✅ 업무 효율성 증가  
✅ 전문적인 이미지
✅ 고객 만족도 향상
```

---

## 🎯 다음 단계

1. **SMS 자동 발송** (CoolSMS/NCP 연동)
2. **예약 일정 관리** (Google Calendar 연동)
3. **후기 시스템** (게시판 형태)
4. **회원 관리** (Firebase Auth)

---

## 📞 도움이 필요하면

```
🆘 설정 중 막히는 부분이 있으면:
- 스크린샷과 함께 문의
- 오류 메시지 전체 복사
- 단계별로 차근차근 확인

💡 성공하면 정말 전문적인 상담센터가 됩니다! 🌟
``` 