// 빠른 SMS 테스트용 - 쿨SMS 사용
// 실제 사용하려면 https://www.coolsms.co.kr 에서 계정 생성 필요

class QuickSMSTest {
    constructor() {
        // 쿨SMS 설정 (실제 값으로 변경 필요)
        this.coolsms = {
            apiKey: 'YOUR_COOLSMS_API_KEY',    // 쿨SMS에서 발급
            apiSecret: 'YOUR_COOLSMS_SECRET',   // 쿨SMS에서 발급
            from: '031-275-3636'                // 등록된 발신번호
        };
    }

    // 쿨SMS로 즉시 테스트
    async sendTestSMS(to, message) {
        try {
            // 실제 쿨SMS API 호출 (계정 있을 때)
            const response = await fetch('https://api.coolsms.co.kr/sms/2/send', {
                method: 'POST',
                headers: {
                    'Authorization': `HMAC-SHA256 apiKey=${this.coolsms.apiKey}, date=${new Date().toISOString()}, salt=${Date.now()}, signature=...`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        to: to,
                        from: this.coolsms.from,
                        text: message
                    }
                })
            });

            if (response.ok) {
                console.log('✅ SMS 발송 성공!');
                return { success: true };
            } else {
                console.log('❌ SMS 발송 실패');
                return { success: false };
            }

        } catch (error) {
            console.log('📱 SMS 테스트 시뮬레이션:', { to, message });
            return { success: true, simulation: true };
        }
    }

    // 카카오톡 알림톡 대안 (무료)
    async sendKakaoNotification(phone, message) {
        // 카카오톡 비즈니스 API 사용 (무료 알림톡)
        console.log('💬 카카오톡 알림 시뮬레이션:', { phone, message });
        
        // 실제로는 여기에 카카오톡 API 호출
        // 또는 카카오워크 웹훅 사용
        return { success: true, method: 'kakao' };
    }

    // 이메일 대안 (Gmail SMTP - 무료)
    async sendGmailNotification(email, subject, content) {
        console.log('📧 Gmail 알림 시뮬레이션:', { email, subject });
        
        // 실제로는 Gmail SMTP 사용
        // 또는 Nodemailer + Gmail 앱 비밀번호
        return { success: true, method: 'gmail' };
    }
}

// 즉시 테스트 함수
async function testNotificationNow() {
    const tester = new QuickSMSTest();
    
    console.log('🧪 알림 시스템 테스트 시작...');
    
    // SMS 테스트
    await tester.sendTestSMS('010-1234-5678', '[조이상담코칭센터] 테스트 메시지입니다.');
    
    // 카카오톡 테스트
    await tester.sendKakaoNotification('010-1234-5678', '카카오톡 테스트 메시지');
    
    // 이메일 테스트
    await tester.sendGmailNotification('test@example.com', '테스트 제목', '테스트 내용');
    
    console.log('✅ 테스트 완료!');
}

// 브라우저 콘솔에서 실행: testNotificationNow()
window.testNotificationNow = testNotificationNow;

export default QuickSMSTest; 