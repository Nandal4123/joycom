// 실제 SMS/이메일 알림 서비스
class NotificationService {
    constructor() {
        // 네이버 클라우드 플랫폼 SMS 설정
        this.ncp = {
            accessKey: 'YOUR_NCP_ACCESS_KEY', // 실제 값으로 변경 필요
            secretKey: 'YOUR_NCP_SECRET_KEY', // 실제 값으로 변경 필요
            serviceId: 'YOUR_NCP_SERVICE_ID', // 실제 값으로 변경 필요
            from: '031-275-3636' // 발신번호 (등록된 번호)
        };

        // EmailJS 설정
        this.emailjs = {
            serviceId: 'service_joycom', // 실제 값으로 변경 필요
            publicKey: 'YOUR_EMAILJS_PUBLIC_KEY', // 실제 값으로 변경 필요
            templates: {
                confirmation: 'template_confirmation', // 신청자 확인
                admin: 'template_admin', // 관리자 알림
                schedule: 'template_schedule' // 일정 확정
            }
        };

        // 카카오워크/Slack 웹훅 설정
        this.webhooks = {
            slack: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK', // 실제 값으로 변경 필요
            kakao: 'YOUR_KAKAO_WEBHOOK_URL' // 실제 값으로 변경 필요
        };

        // 관리자 연락처
        this.adminContacts = {
            phones: ['010-0000-0000'], // 실제 번호로 변경 필요
            emails: ['admin@joycom.or.kr'] // 실제 이메일로 변경 필요
        };
    }

    // =================================
    // SMS 발송 기능 (네이버 클라우드)
    // =================================

    async sendSMS(to, message) {
        try {
            const timestamp = Date.now().toString();
            const signature = this.makeSignature('POST', `/sms/v2/services/${this.ncp.serviceId}/messages`, timestamp);

            const response = await fetch(`https://sens.apigw.ntruss.com/sms/v2/services/${this.ncp.serviceId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-ncp-apigw-timestamp': timestamp,
                    'x-ncp-iam-access-key': this.ncp.accessKey,
                    'x-ncp-apigw-signature-v2': signature
                },
                body: JSON.stringify({
                    type: 'SMS',
                    from: this.ncp.from,
                    content: message,
                    messages: [{ to: to }]
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ SMS 발송 성공:', { to, message: message.substring(0, 50) + '...' });
                return { success: true, data: result };
            } else {
                console.error('❌ SMS 발송 실패:', result);
                return { success: false, error: result };
            }

        } catch (error) {
            console.error('❌ SMS 발송 오류:', error);
            return { success: false, error: error.message };
        }
    }

    // NCP 서명 생성
    makeSignature(method, uri, timestamp) {
        const crypto = require('crypto'); // Node.js 환경에서 사용
        const message = `${method} ${uri}\n${timestamp}\n${this.ncp.accessKey}`;
        const signature = crypto.createHmac('sha256', this.ncp.secretKey).update(message).digest('base64');
        return signature;
    }

    // SMS 발송 (브라우저용 - Fetch API 사용)
    async sendSMSBrowser(to, message) {
        try {
            // 브라우저에서는 CORS 제한으로 직접 호출 불가
            // 백엔드 API를 통해 발송하거나 Firebase Cloud Functions 사용
            
            const response = await fetch('/api/send-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, message })
            });

            return await response.json();
        } catch (error) {
            console.error('SMS 발송 실패:', error);
            // 개발 중에는 시뮬레이션으로 대체
            console.log('📱 SMS 시뮬레이션:', { to, message });
            return { success: true, simulation: true };
        }
    }

    // =================================
    // 이메일 발송 기능 (EmailJS)
    // =================================

    async sendEmail(templateId, templateParams) {
        try {
            // EmailJS 라이브러리가 로드되어 있는지 확인
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS 라이브러리가 로드되지 않았습니다.');
            }

            const response = await emailjs.send(
                this.emailjs.serviceId,
                templateId,
                templateParams,
                this.emailjs.publicKey
            );

            console.log('✅ 이메일 발송 성공:', response);
            return { success: true, data: response };

        } catch (error) {
            console.error('❌ 이메일 발송 실패:', error);
            // 개발 중에는 시뮬레이션으로 대체
            console.log('📧 이메일 시뮬레이션:', { templateId, templateParams });
            return { success: false, error: error.message, simulation: true };
        }
    }

    // =================================
    // 통합 알림 발송 함수들
    // =================================

    // 신청자에게 확인 알림
    async sendConfirmationToApplicant(applicationData) {
        const { name, phone, email, id, consultationType, consultationMethod } = applicationData;

        // SMS 발송
        if (phone) {
            const smsMessage = `[조이상담코칭센터]
${name}님의 상담신청이 접수되었습니다.

신청번호: ${id}
상담유형: ${this.getConsultationTypeLabel(consultationType)}
처리예정: 24시간 내 연락

문의: 031-275-3636`;

            await this.sendSMSBrowser(phone, smsMessage);
        }

        // 이메일 발송
        if (email) {
            const emailParams = {
                to_name: name,
                to_email: email,
                application_id: id,
                consultation_type: this.getConsultationTypeLabel(consultationType),
                consultation_method: this.getConsultationMethodLabel(consultationMethod),
                phone: phone,
                center_phone: '031-275-3636',
                center_address: '용인시 기흥구 동백3로11번길 3, 동백역타워 601호'
            };

            await this.sendEmail(this.emailjs.templates.confirmation, emailParams);
        }

        return { success: true, message: '신청자 알림 발송 완료' };
    }

    // 관리자에게 신청 알림
    async sendNotificationToAdmin(applicationData) {
        const { name, phone, email, consultationType, consultationMethod, preferredDate, preferredTime, message } = applicationData;

        // 관리자 SMS 발송
        for (const adminPhone of this.adminContacts.phones) {
            const smsMessage = `[새 상담신청 알림]
신청자: ${name}
연락처: ${phone}
상담유형: ${this.getConsultationTypeLabel(consultationType)}
신청시간: ${new Date().toLocaleString('ko-KR')}

▶ 24시간 내 연락 필수`;

            await this.sendSMSBrowser(adminPhone, smsMessage);
        }

        // 관리자 이메일 발송
        for (const adminEmail of this.adminContacts.emails) {
            const emailParams = {
                admin_email: adminEmail,
                applicant_name: name,
                applicant_phone: phone,
                applicant_email: email || '-',
                consultation_type: this.getConsultationTypeLabel(consultationType),
                consultation_method: this.getConsultationMethodLabel(consultationMethod),
                preferred_date: preferredDate || '-',
                preferred_time: preferredTime ? this.getTimeLabel(preferredTime) : '-',
                message: message || '-',
                application_time: new Date().toLocaleString('ko-KR'),
                admin_url: 'https://joycom.vercel.app/admin.html'
            };

            await this.sendEmail(this.emailjs.templates.admin, emailParams);
        }

        // Slack 알림
        await this.sendSlackNotification(applicationData);

        return { success: true, message: '관리자 알림 발송 완료' };
    }

    // 상담 확정 알림
    async sendScheduleConfirmation(applicationData, scheduleInfo) {
        const { name, phone, email } = applicationData;
        const { date, time, counselor, location, notes } = scheduleInfo;

        // 신청자 SMS 발송
        if (phone) {
            const smsMessage = `[조이상담코칭센터] 상담 일정 확정

${name}님의 상담이 확정되었습니다.

📅 일시: ${date} ${time}
📍 장소: ${location}
👩‍⚕️ 상담사: ${counselor}

준비사항: ${notes || '신분증 지참'}
문의: 031-275-3636

* 상담 30분 전 도착 부탁드립니다.`;

            await this.sendSMSBrowser(phone, smsMessage);
        }

        // 신청자 이메일 발송
        if (email) {
            const emailParams = {
                to_name: name,
                to_email: email,
                schedule_date: date,
                schedule_time: time,
                counselor: counselor,
                location: location,
                notes: notes || '신분증을 지참해 주세요',
                center_phone: '031-275-3636'
            };

            await this.sendEmail(this.emailjs.templates.schedule, emailParams);
        }

        return { success: true, message: '일정 확정 알림 발송 완료' };
    }

    // =================================
    // Slack 알림
    // =================================

    async sendSlackNotification(applicationData) {
        try {
            const { name, phone, consultationType, consultationMethod } = applicationData;

            const slackMessage = {
                text: "🚨 새로운 상담신청이 접수되었습니다!",
                attachments: [
                    {
                        color: "good",
                        fields: [
                            { title: "신청자", value: name, short: true },
                            { title: "연락처", value: phone, short: true },
                            { title: "상담유형", value: this.getConsultationTypeLabel(consultationType), short: true },
                            { title: "상담방식", value: this.getConsultationMethodLabel(consultationMethod), short: true },
                            { title: "신청시간", value: new Date().toLocaleString('ko-KR'), short: false }
                        ],
                        actions: [
                            {
                                type: "button",
                                text: "관리자 페이지 확인",
                                url: "https://joycom.vercel.app/admin.html"
                            }
                        ]
                    }
                ]
            };

            if (this.webhooks.slack && this.webhooks.slack !== 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK') {
                const response = await fetch(this.webhooks.slack, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(slackMessage)
                });

                if (response.ok) {
                    console.log('✅ Slack 알림 발송 성공');
                } else {
                    console.error('❌ Slack 알림 발송 실패');
                }
            } else {
                console.log('💬 Slack 알림 시뮬레이션:', slackMessage);
            }

        } catch (error) {
            console.error('Slack 알림 오류:', error);
        }
    }

    // =================================
    // 유틸리티 함수들
    // =================================

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

    getTimeLabel(time) {
        const labels = {
            'morning': '오전 (09:00-12:00)',
            'afternoon': '오후 (13:00-17:00)',
            'evening': '저녁 (18:00-21:00)'
        };
        return labels[time] || time;
    }
}

// 전역 인스턴스 생성
window.notificationService = new NotificationService();

export default NotificationService; 