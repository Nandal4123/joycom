// 상담신청 알림 서비스
class ConsultationNotificationService {
    constructor() {
        this.smsApiKey = 'YOUR_SMS_API_KEY'; // 실제 SMS 서비스 API 키
        this.emailService = 'YOUR_EMAIL_SERVICE'; // 이메일 서비스 설정
    }

    // 신청자에게 확인 SMS 발송
    async sendConfirmationSMS(phone, name, applicationId) {
        const message = `
[조이상담코칭센터]
${name}님의 상담신청이 접수되었습니다.

신청번호: ${applicationId}
처리예정: 24시간 내 연락

문의: 031-275-3636
        `.trim();

        try {
            // 실제 SMS API 연동 필요
            console.log('SMS 발송:', { phone, message });
            return { success: true, message: 'SMS 발송 완료' };
        } catch (error) {
            console.error('SMS 발송 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 신청자에게 확인 이메일 발송
    async sendConfirmationEmail(email, name, applicationData) {
        const emailContent = `
        <h2>🎉 상담신청이 완료되었습니다</h2>
        
        <p><strong>${name}</strong>님, 안녕하세요!</p>
        <p>조이상담코칭센터에 상담신청해 주셔서 감사합니다.</p>
        
        <h3>📋 신청 내용</h3>
        <ul>
            <li><strong>신청번호:</strong> ${applicationData.id}</li>
            <li><strong>상담유형:</strong> ${this.getConsultationTypeLabel(applicationData.consultationType)}</li>
            <li><strong>상담방식:</strong> ${this.getConsultationMethodLabel(applicationData.consultationMethod)}</li>
            <li><strong>연락처:</strong> ${applicationData.phone}</li>
        </ul>
        
        <h3>📞 다음 단계</h3>
        <p>✅ <strong>24시간 내</strong>에 담당자가 연락드립니다</p>
        <p>✅ 상담 일정을 협의하여 확정합니다</p>
        <p>✅ 상담 전 안내사항을 알려드립니다</p>
        
        <hr>
        <p>📍 <strong>조이상담코칭센터</strong></p>
        <p>📞 031-275-3636 | 🌐 www.joycom.or.kr</p>
        <p>📍 용인시 기흥구 동백3로11번길 3, 동백역타워 601호</p>
        `;

        try {
            // 실제 이메일 API 연동 필요
            console.log('이메일 발송:', { email, content: emailContent });
            return { success: true, message: '이메일 발송 완료' };
        } catch (error) {
            console.error('이메일 발송 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 관리자에게 새 신청 알림
    async sendAdminNotification(applicationData) {
        const adminMessage = `
[새 상담신청 알림]

신청자: ${applicationData.name}
연락처: ${applicationData.phone}
상담유형: ${this.getConsultationTypeLabel(applicationData.consultationType)}
상담방식: ${this.getConsultationMethodLabel(applicationData.consultationMethod)}
신청시간: ${new Date().toLocaleString('ko-KR')}

상담신청서 확인: https://joycom.vercel.app/admin.html
        `.trim();

        // 관리자 SMS 발송
        await this.sendAdminSMS(adminMessage);
        
        // 관리자 이메일 발송
        await this.sendAdminEmail(applicationData);
        
        return { success: true, message: '관리자 알림 발송 완료' };
    }

    // 관리자 SMS 발송
    async sendAdminSMS(message) {
        const adminPhones = [
            '031-275-3636', // 센터 전화번호
            // 추가 관리자 번호들
        ];

        for (const phone of adminPhones) {
            try {
                console.log('관리자 SMS 발송:', { phone, message });
                // 실제 SMS API 호출
            } catch (error) {
                console.error('관리자 SMS 발송 실패:', error);
            }
        }
    }

    // 관리자 이메일 발송
    async sendAdminEmail(applicationData) {
        const adminEmails = [
            'admin@joycom.or.kr', // 관리자 이메일
            // 추가 관리자 이메일들
        ];

        const emailContent = `
        <h2>🚨 새로운 상담신청이 접수되었습니다</h2>
        
        <h3>📋 신청자 정보</h3>
        <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr><td><strong>이름</strong></td><td>${applicationData.name}</td></tr>
            <tr><td><strong>연락처</strong></td><td>${applicationData.phone}</td></tr>
            <tr><td><strong>이메일</strong></td><td>${applicationData.email || '-'}</td></tr>
            <tr><td><strong>상담유형</strong></td><td>${this.getConsultationTypeLabel(applicationData.consultationType)}</td></tr>
            <tr><td><strong>상담방식</strong></td><td>${this.getConsultationMethodLabel(applicationData.consultationMethod)}</td></tr>
            <tr><td><strong>희망일시</strong></td><td>${applicationData.preferredDate || '-'} ${applicationData.preferredTime || ''}</td></tr>
            <tr><td><strong>상담내용</strong></td><td>${applicationData.message || '-'}</td></tr>
            <tr><td><strong>신청시간</strong></td><td>${new Date().toLocaleString('ko-KR')}</td></tr>
        </table>
        
        <p><a href="https://joycom.vercel.app/admin.html" style="background: #66C6C6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">관리자 페이지에서 확인하기</a></p>
        
        <p><strong>⚠️ 24시간 내 연락 필수</strong></p>
        `;

        for (const email of adminEmails) {
            try {
                console.log('관리자 이메일 발송:', { email, content: emailContent });
                // 실제 이메일 API 호출
            } catch (error) {
                console.error('관리자 이메일 발송 실패:', error);
            }
        }
    }

    // 상담 확정 알림 (신청자에게)
    async sendConfirmationSchedule(applicationData, scheduleInfo) {
        const message = `
[조이상담코칭센터] 상담 일정 확정

${applicationData.name}님의 상담이 확정되었습니다.

📅 일시: ${scheduleInfo.date} ${scheduleInfo.time}
📍 장소: ${scheduleInfo.location}
👩‍⚕️ 상담사: ${scheduleInfo.counselor}

준비사항이나 문의사항이 있으시면 연락주세요.
📞 031-275-3636
        `.trim();

        // SMS 및 이메일 발송
        if (applicationData.phone) {
            await this.sendConfirmationSMS(applicationData.phone, applicationData.name, message);
        }
        if (applicationData.email) {
            await this.sendScheduleEmail(applicationData.email, applicationData.name, scheduleInfo);
        }
    }

    // 유틸리티 함수들
    getConsultationTypeLabel(type) {
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

    getConsultationMethodLabel(method) {
        const labels = {
            'offline': '대면상담',
            'phone': '전화상담',
            'online': '온라인상담'
        };
        return labels[method] || method;
    }
}

export default ConsultationNotificationService; 