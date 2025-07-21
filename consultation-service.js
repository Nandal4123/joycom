// 상담신청서 Firebase 서비스
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';

class ConsultationService {
    constructor(db) {
        this.db = db;
        this.collectionName = 'consultations';
    }

    // 상담신청서 저장
    async saveConsultation(consultationData) {
        try {
            // 데이터 검증
            if (!consultationData.name || !consultationData.phone || 
                !consultationData.consultationType || !consultationData.consultationMethod) {
                throw new Error('필수 항목이 누락되었습니다.');
            }

            // 서버 타임스탬프와 함께 데이터 구성
            const dataToSave = {
                ...consultationData,
                status: 'pending', // 상담 상태: pending, contacted, scheduled, completed
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Firestore에 저장
            const docRef = await addDoc(collection(this.db, this.collectionName), dataToSave);
            
            console.log('상담신청서가 성공적으로 저장되었습니다. ID:', docRef.id);
            return {
                success: true,
                id: docRef.id,
                message: '상담신청이 접수되었습니다.'
            };

        } catch (error) {
            console.error('상담신청서 저장 중 오류 발생:', error);
            return {
                success: false,
                error: error.message,
                message: '신청 접수 중 오류가 발생했습니다. 다시 시도해주세요.'
            };
        }
    }

    // 상담신청서 목록 조회 (관리자용)
    async getConsultations() {
        try {
            const q = query(
                collection(this.db, this.collectionName), 
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            
            const consultations = [];
            querySnapshot.forEach((doc) => {
                consultations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return {
                success: true,
                data: consultations
            };

        } catch (error) {
            console.error('상담신청서 조회 중 오류 발생:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 데이터 유효성 검증
    validateConsultationData(data) {
        const errors = [];

        // 필수 필드 검증
        if (!data.name?.trim()) {
            errors.push('이름을 입력해주세요.');
        }

        if (!data.phone?.trim()) {
            errors.push('연락처를 입력해주세요.');
        } else if (!/^[0-9-+\s()]+$/.test(data.phone)) {
            errors.push('올바른 전화번호 형식을 입력해주세요.');
        }

        if (!data.consultationType) {
            errors.push('상담 유형을 선택해주세요.');
        }

        if (!data.consultationMethod) {
            errors.push('상담 방식을 선택해주세요.');
        }

        // 이메일 유효성 검증 (선택사항)
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('올바른 이메일 형식을 입력해주세요.');
        }

        if (!data.privacyConsent) {
            errors.push('개인정보 수집 및 이용에 동의해주세요.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

export default ConsultationService; 