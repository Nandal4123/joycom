# 조이상담코칭센터 Firebase 백엔드 설정 가이드

## 🔥 Firebase 프로젝트 설정

### 1. Firebase 콘솔에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `joy-counseling-center` (또는 원하는 이름)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

### 2. Firestore 데이터베이스 설정

1. Firebase 콘솔 > "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 모드 선택:
   - **테스트 모드**: 개발 단계에서 사용 (30일 후 자동으로 보안 규칙 적용)
   - **잠금 모드**: 보안 규칙을 수동으로 설정해야 함

4. 위치 선택: `asia-northeast3 (서울)` 권장

### 3. 웹 앱 등록 및 설정

1. Firebase 콘솔 > 프로젝트 설정 > "일반" 탭
2. "앱 추가" > "웹" 선택
3. 앱 닉네임: `joy-counseling-web`
4. Firebase Hosting 설정 (선택사항)
5. **Firebase SDK 설정 코드 복사**

### 4. 설정 코드 적용

복사한 Firebase 설정을 다음 파일들에 적용:

#### `index.html` 수정
```javascript
// Firebase 설정 (실제 프로젝트 설정으로 교체)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

#### `admin.html` 수정
같은 설정을 admin.html 파일에도 적용합니다.

#### `firebase-config.js` 수정 (선택사항)
별도 설정 파일을 사용하는 경우 해당 파일도 수정합니다.

## 🔒 Firestore 보안 규칙 설정

### 기본 보안 규칙 (개발용)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 상담신청서 컬렉션
    match /consultations/{document} {
      // 읽기: 인증된 사용자만 (관리자용)
      allow read: if request.auth != null;
      // 쓰기: 모든 사용자 (상담신청서 제출용)
      allow write: if true;
    }
  }
}
```

### 프로덕션용 보안 규칙 (권장)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 상담신청서 컬렉션
    match /consultations/{document} {
      // 읽기: 관리자 역할이 있는 인증된 사용자만
      allow read: if request.auth != null && 
                  request.auth.token.admin == true;
      
      // 생성: 모든 사용자 (상담신청서 제출)
      allow create: if validateConsultationData(request.resource.data);
      
      // 수정: 관리자만 (상태 업데이트)
      allow update: if request.auth != null && 
                    request.auth.token.admin == true;
      
      // 삭제: 관리자만
      allow delete: if request.auth != null && 
                    request.auth.token.admin == true;
    }
    
    // 상담신청서 데이터 유효성 검증
    function validateConsultationData(data) {
      return data.keys().hasAll(['name', 'phone', 'consultationType', 'consultationMethod']) &&
             data.name is string && data.name.size() > 0 &&
             data.phone is string && data.phone.size() > 0 &&
             data.consultationType in ['individual', 'couple', 'child', 'art', 'affair', 'petloss'] &&
             data.consultationMethod in ['offline', 'phone', 'online'];
    }
  }
}
```

## 📊 Firestore 데이터 구조

### `consultations` 컬렉션
```javascript
{
  // 문서 ID: 자동 생성
  name: "홍길동",                    // 신청자 이름
  phone: "010-1234-5678",           // 연락처
  email: "hong@example.com",        // 이메일 (선택)
  consultationType: "individual",    // 상담 유형
  consultationMethod: "offline",     // 상담 방식
  preferredDate: "2024-01-15",      // 희망 날짜 (선택)
  preferredTime: "morning",         // 희망 시간 (선택)
  message: "상담받고 싶은 내용...",    // 상담 내용 (선택)
  privacyConsent: true,             // 개인정보 동의
  status: "pending",                // 상담 상태
  createdAt: timestamp,             // 생성 시간
  updatedAt: timestamp              // 수정 시간
}
```

### 상담 상태 (status) 값
- `pending`: 대기 중
- `contacted`: 연락 완료
- `scheduled`: 예약 완료
- `completed`: 상담 완료

## 🚀 배포 및 호스팅

### Firebase Hosting 사용 (권장)
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 배포
firebase deploy
```

### 호스팅 설정 (`firebase.json`)
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 👨‍💼 관리자 인증 설정 (선택사항)

Firebase Authentication을 사용하여 관리자 페이지 보안 강화:

1. Firebase Console > Authentication > 시작하기
2. 로그인 방법에서 "이메일/비밀번호" 활성화
3. 사용자 추가 시 관리자 권한 부여:

```javascript
// Firebase Admin SDK 사용 (서버 측)
admin.auth().setCustomUserClaims(uid, { admin: true });
```

## 📱 실시간 알림 설정 (선택사항)

새로운 상담신청이 들어올 때 실시간 알림:

### Cloud Functions 설정
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.onNewConsultation = functions.firestore
  .document('consultations/{consultationId}')
  .onCreate(async (snap, context) => {
    const newConsultation = snap.data();
    
    // 이메일 알림 또는 SMS 발송
    console.log('새로운 상담신청:', newConsultation.name);
    
    // TODO: 알림 로직 구현
  });
```

## 🛠️ 개발 및 테스트

### 로컬 개발 환경
```bash
# Firebase Emulator 설치 및 실행
firebase emulators:start --only firestore
```

### 테스트 데이터 추가
관리자 페이지에서 테스트를 위해 샘플 데이터를 추가할 수 있습니다.

## 📞 지원 및 문의

Firebase 설정 관련 문의사항이 있으시면:
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firebase 커뮤니티](https://firebase.google.com/community)

---

## 🎯 다음 단계

1. ✅ Firebase 프로젝트 생성
2. ✅ Firestore 데이터베이스 설정
3. ✅ 웹 앱 등록 및 설정 코드 적용
4. ✅ 보안 규칙 설정
5. ✅ 상담신청서 테스트
6. ✅ 관리자 페이지 테스트
7. 🔄 실제 환경 배포
8. 🔄 관리자 인증 설정 (선택)
9. 🔄 실시간 알림 설정 (선택)

Firebase 설정이 완료되면 조이상담코칭센터 웹사이트에서 실제로 상담신청서를 접수하고 관리할 수 있습니다! 