const functions = require('firebase-functions');
const fetch = require('node-fetch');
const crypto = require('crypto');
const admin = require('firebase-admin');

// Firebase Admin 초기화
admin.initializeApp();

// NCP SMS 설정 (환경 변수로 관리)
const NCP_CONFIG = {
    accessKey: functions.config().ncp?.access_key || 'YOUR_ACCESS_KEY',
    secretKey: functions.config().ncp?.secret_key || 'YOUR_SECRET_KEY',
    serviceId: functions.config().ncp?.service_id || 'YOUR_SERVICE_ID',
    from: '031-275-3636'
};

// CoolSMS 설정 (환경 변수로 관리)
const COOLSMS_CONFIG = {
    apiKey: functions.config().coolsms?.api_key || 'YOUR_COOLSMS_API_KEY',
    apiSecret: functions.config().coolsms?.api_secret || 'YOUR_COOLSMS_API_SECRET',
    from: '031-275-3636'
};

// 관리자 연락처 (환경 변수로 관리)
const ADMIN_CONTACTS = {
    phones: functions.config().admin?.phones?.split(',') || ['010-0000-0000'],
    emails: functions.config().admin?.emails?.split(',') || ['admin@joycom.or.kr']
};

// 서명 생성 함수
function makeSignature(method, uri, timestamp) {
    const message = `${method} ${uri}\n${timestamp}\n${NCP_CONFIG.accessKey}`;
    return crypto.createHmac('sha256', NCP_CONFIG.secretKey).update(message).digest('base64');
}

// NCP SMS 발송 함수
async function sendNCPSMS(to, message) {
    try {
        const timestamp = Date.now().toString();
        const signature = makeSignature('POST', `/sms/v2/services/${NCP_CONFIG.serviceId}/messages`, timestamp);

        const response = await fetch(`https://sens.apigw.ntruss.com/sms/v2/services/${NCP_CONFIG.serviceId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-iam-access-key': NCP_CONFIG.accessKey,
                'x-ncp-apigw-signature-v2': signature
            },
            body: JSON.stringify({
                type: message.length > 90 ? 'LMS' : 'SMS',
                from: NCP_CONFIG.from,
                content: message,
                messages: [{ to }]
            })
        });

        const result = await response.json();
        return { success: response.ok, data: result, provider: 'ncp' };

    } catch (error) {
        console.error('NCP SMS 발송 오류:', error);
        return { success: false, error: error.message };
    }
}

// CoolSMS 발송 함수
async function sendCoolSMS(to, message) {
    try {
        const response = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
            method: 'POST',
            headers: {
                'Authorization': `HMAC-SHA256 apiKey=${COOLSMS_CONFIG.apiKey}, date=${new Date().toISOString()}, salt=${Date.now()}, signature=${generateCoolSMSSignature()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: {
                    from: COOLSMS_CONFIG.from,
                    to: to,
                    text: message,
                    type: message.length > 90 ? 'LMS' : 'SMS'
                }
            })
        });

        const result = await response.json();
        return { success: response.ok, data: result, provider: 'coolsms' };

    } catch (error) {
        console.error('CoolSMS 발송 오류:', error);
        return { success: false, error: error.message };
    }
}

// CoolSMS 서명 생성
function generateCoolSMSSignature() {
    const date = new Date().toISOString();
    const salt = Date.now();
    const data = `${date}${salt}`;
    return crypto.createHmac('sha256', COOLSMS_CONFIG.apiSecret).update(data).digest('hex');
}

// 통합 SMS 발송 함수 (여러 제공업체 시도)
async function sendSMSWithFallback(to, message) {
    console.log('📱 SMS 발송 시작:', { to, messageLength: message.length });

    // 1차: CoolSMS 시도
    try {
        if (COOLSMS_CONFIG.apiKey !== 'YOUR_COOLSMS_API_KEY') {
            const result = await sendCoolSMS(to, message);
            if (result.success) {
                console.log('✅ CoolSMS 발송 성공');
                return result;
            }
        }
    } catch (error) {
        console.log('CoolSMS 실패, NCP 시도 중...');
    }

    // 2차: NCP SENS 시도
    try {
        if (NCP_CONFIG.accessKey !== 'YOUR_ACCESS_KEY') {
            const result = await sendNCPSMS(to, message);
            if (result.success) {
                console.log('✅ NCP SMS 발송 성공');
                return result;
            }
        }
    } catch (error) {
        console.log('NCP SMS 실패');
    }

    // 모든 시도 실패
    console.log('❌ 모든 SMS 제공업체 발송 실패');
    return { 
        success: false, 
        error: '모든 SMS 제공업체 발송 실패',
        provider: 'none'
    };
}

// 상담 유형 라벨 변환
function getConsultationTypeLabel(type) {
    const labels = {
        'individual': '개인상담',
        'couple': '부부·가족상담',
        'child': '아동·청소년 상담',
        'art': '사진/미술 치료',
        'affair': '외도상담',
        'petloss': '펫로스 상담'
    };
    return labels[type] || type;
}

// =================================
// 공개 API 함수들
// =================================

// SMS 발송 API (외부에서 호출 가능)
exports.sendSMS = functions.https.onRequest(async (req, res) => {
    // CORS 헤더 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // POST 요청만 허용
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }

    try {
        const { to, message } = req.body;

        // 입력값 검증
        if (!to || !message) {
            res.status(400).json({ 
                success: false, 
                error: '전화번호와 메시지가 필요합니다.' 
            });
            return;
        }

        // SMS 발송 (다중 제공업체 지원)
        const result = await sendSMSWithFallback(to, message);
        
        console.log('SMS 발송 결과:', { to, success: result.success, provider: result.provider });
        res.json(result);

    } catch (error) {
        console.error('SMS API 오류:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 신청자에게 확인 SMS 발송
exports.sendConfirmationSMS = functions.https.onCall(async (data, context) => {
    try {
        const { name, phone, applicationId, consultationType } = data;

        const message = `[조이상담코칭센터]
${name}님의 상담신청이 접수되었습니다.

신청번호: ${applicationId}
상담유형: ${getConsultationTypeLabel(consultationType)}
처리예정: 24시간 내 연락

문의: 031-275-3636`;

        const result = await sendSMSWithFallback(phone, message);
        
        console.log('확인 SMS 발송:', { name, phone, success: result.success, provider: result.provider });
        return result;

    } catch (error) {
        console.error('확인 SMS 발송 오류:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 관리자에게 알림 SMS 발송
exports.sendAdminNotificationSMS = functions.https.onCall(async (data, context) => {
    try {
        const { name, phone, consultationType } = data;

        const message = `[새 상담신청 알림]
신청자: ${name}
연락처: ${phone}
상담유형: ${getConsultationTypeLabel(consultationType)}
신청시간: ${new Date().toLocaleString('ko-KR')}

▶ 24시간 내 연락 필수`;

        const results = [];
        
        // 모든 관리자에게 SMS 발송
        for (const adminPhone of ADMIN_CONTACTS.phones) {
            const result = await sendSMSWithFallback(adminPhone, message);
            results.push({ phone: adminPhone, ...result });
        }

        console.log('관리자 알림 SMS 발송:', { name, results });
        return { success: true, results };

    } catch (error) {
        console.error('관리자 알림 SMS 발송 오류:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// =================================
// Firestore 트리거 함수들
// =================================

// 새로운 상담신청 자동 알림
exports.onNewConsultation = functions.firestore
    .document('consultations/{consultationId}')
    .onCreate(async (snap, context) => {
        try {
            const data = snap.data();
            const consultationId = context.params.consultationId;
            
            console.log('새로운 상담신청 감지:', data.name);

            // 신청자에게 확인 SMS 발송
            if (data.phone) {
                const confirmMessage = `[조이상담코칭센터]
${data.name}님의 상담신청이 접수되었습니다.

신청번호: ${consultationId.substring(0, 8)}
상담유형: ${getConsultationTypeLabel(data.consultationType)}
처리예정: 24시간 내 연락

문의: 031-275-3636`;

                const confirmResult = await sendSMSWithFallback(data.phone, confirmMessage);
                console.log('신청자 확인 SMS 발송 완료:', data.name, confirmResult.provider);
            }

            // 관리자에게 알림 SMS 발송
            const adminMessage = `[새 상담신청 알림]
신청자: ${data.name}
연락처: ${data.phone}
상담유형: ${getConsultationTypeLabel(data.consultationType)}
신청시간: ${new Date().toLocaleString('ko-KR')}

관리자 페이지: https://joycom.vercel.app/admin.html

▶ 24시간 내 연락 필수`;

            for (const adminPhone of ADMIN_CONTACTS.phones) {
                await sendSMSWithFallback(adminPhone, adminMessage);
            }
            
            console.log('관리자 알림 SMS 발송 완료:', data.name);

        } catch (error) {
            console.error('자동 알림 발송 오류:', error);
            // 오류가 발생해도 상담신청 자체는 영향받지 않음
        }
    });

// 상담 상태 변경 시 알림
exports.onConsultationStatusUpdate = functions.firestore
    .document('consultations/{consultationId}')
    .onUpdate(async (change, context) => {
        try {
            const before = change.before.data();
            const after = change.after.data();
            
            // 상태가 변경된 경우에만 처리
            if (before.status !== after.status) {
                console.log('상담 상태 변경:', {
                    name: after.name,
                    from: before.status,
                    to: after.status
                });

                // 예약 확정 시 신청자에게 알림
                if (after.status === 'scheduled' && after.phone) {
                    const message = `[조이상담코칭센터] 상담 예약 확정

${after.name}님의 상담이 예약되었습니다.

담당자가 곧 상세 일정을 안내드립니다.
문의: 031-275-3636

감사합니다.`;

                    const scheduleResult = await sendSMSWithFallback(after.phone, message);
                    console.log('예약 확정 알림 발송:', after.name, scheduleResult.provider);
                }
            }

        } catch (error) {
            console.error('상태 변경 알림 오류:', error);
        }
    });

// =================================
// 유틸리티 함수들
// =================================

// 관리자 연락처 설정 조회
exports.getAdminContacts = functions.https.onCall(async (data, context) => {
    // 관리자만 접근 가능하도록 인증 확인 (추후 구현)
    return {
        phones: ADMIN_CONTACTS.phones,
        emails: ADMIN_CONTACTS.emails
    };
});

// SMS 발송 상태 확인
exports.checkSMSStatus = functions.https.onCall(async (data, context) => {
    // NCP SMS 발송 이력 조회 (필요시 구현)
    return { 
        success: true, 
        message: 'SMS 상태 확인 기능 (구현 예정)' 
    };
});

// 일일 통계 리포트 (스케줄 함수)
exports.dailyReport = functions.pubsub
    .schedule('0 9 * * *') // 매일 오전 9시
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        try {
            // 어제 상담신청 통계 조회
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const snapshot = await admin.firestore()
                .collection('consultations')
                .where('createdAt', '>=', yesterday)
                .where('createdAt', '<', today)
                .get();

            const total = snapshot.size;
            const types = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                types[data.consultationType] = (types[data.consultationType] || 0) + 1;
            });

            const reportMessage = `[조이상담코칭센터] 일일 리포트

📅 ${yesterday.toLocaleDateString('ko-KR')}
📊 총 신청: ${total}건

상담유형별:
${Object.entries(types).map(([type, count]) => 
    `• ${getConsultationTypeLabel(type)}: ${count}건`
).join('\n')}

관리자 페이지: https://joycom.vercel.app/admin.html`;

            // 관리자에게 리포트 발송
            for (const adminPhone of ADMIN_CONTACTS.phones) {
                await sendSMSWithFallback(adminPhone, reportMessage);
            }

            console.log('일일 리포트 발송 완료:', { total, types });

        } catch (error) {
            console.error('일일 리포트 오류:', error);
        }
    });

console.log('Firebase Cloud Functions 로드 완료');
console.log('SMS 제공업체 설정:');
console.log('- CoolSMS:', { 
    apiKey: COOLSMS_CONFIG.apiKey !== 'YOUR_COOLSMS_API_KEY' ? '설정됨' : '미설정'
});
console.log('- NCP SENS:', { 
    accessKey: NCP_CONFIG.accessKey !== 'YOUR_ACCESS_KEY' ? '설정됨' : '미설정',
    serviceId: NCP_CONFIG.serviceId !== 'YOUR_SERVICE_ID' ? '설정됨' : '미설정'
});
console.log('관리자 연락처:', ADMIN_CONTACTS); 