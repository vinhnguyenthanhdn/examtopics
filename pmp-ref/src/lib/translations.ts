import type { Language } from '../types';

interface Translations {
    [key: string]: {
        vi: string;
        en: string;
    };
}

const translations: Translations = {
    app_title: {
        vi: 'PMP Training Center',
        en: 'PMP Training Center',
    },
    question_header: {
        vi: 'Câu hỏi',
        en: 'Question',
    },
    of: {
        vi: 'của',
        en: 'of',
    },
    select_answer: {
        vi: 'Chọn câu trả lời',
        en: 'Select your answer',
    },
    select_multiple: {
        vi: 'Chọn nhiều câu trả lời',
        en: 'Select multiple answers',
    },
    btn_submit: {
        vi: 'Nộp bài',
        en: 'Submit',
    },
    btn_theory: {
        vi: '📚 Lý thuyết',
        en: '📚 Theory',
    },
    btn_explain: {
        vi: '🤖 Giải thích',
        en: '🤖 Explain',
    },
    btn_previous: {
        vi: '← Trước',
        en: '← Previous',
    },
    btn_next: {
        vi: 'Sau →',
        en: 'Next →',
    },
    correct: {
        vi: '✅ Chính xác!',
        en: '✅ Correct!',
    },
    incorrect: {
        vi: '❌ Sai rồi!',
        en: '❌ Incorrect!',
    },
    correct_answer: {
        vi: 'Đáp án đúng',
        en: 'Correct answer',
    },
    your_answer: {
        vi: 'Câu trả lời của bạn',
        en: 'Your answer',
    },
    loading_theory: {
        vi: '⏳ Đang tải kiến thức PMP...',
        en: '⏳ Loading PMP knowledge...',
    },
    loading_explanation: {
        vi: '⏳ Đang phân tích câu hỏi PMP...',
        en: '⏳ Analyzing PMP question...',
    },
    ai_explanation: {
        vi: '💡 Giải Thích',
        en: '💡 Explanation',
    },
    ai_theory: {
        vi: '📚 Cơ Sở Lý Thuyết',
        en: '📚 Theoretical Foundation',
    },
    jump_to_question: {
        vi: 'Câu số',
        en: 'Go to #',
    },
    progress: {
        vi: 'Tiến độ',
        en: 'Progress',
    },
    contact: {
        vi: 'Liên hệ',
        en: 'Contact',
    },
    login_cta: {
        vi: 'Đăng nhập để cá nhân hóa quá trình học',
        en: 'Sign in to personalize your learning',
    },
    login_required_title: {
        vi: 'Vui lòng đăng nhập',
        en: 'Please Log In',
    },
    login_required_desc: {
        vi: 'Bạn cần đăng nhập bằng tài khoản Google để bắt đầu luyện thi PMP và lưu kết quả học tập của mình.',
        en: 'You need to sign in with your Google account to start practicing for PMP and save your progress.',
    },
    login_button: {
        vi: 'Đăng nhập bằng Google',
        en: 'Sign in with Google',
    },
    pending_approval_title: {
        vi: '⏳ Tài khoản đang chờ duyệt',
        en: '⏳ Account Pending Approval',
    },
    pending_approval_desc: {
        vi: 'Cảm ơn bạn đã đăng ký. Tài khoản của bạn đang chờ quản trị viên phê duyệt. Vui lòng quay lại sau.',
        en: 'Thank you for signing up. Your account is pending approval from an administrator. Please check back later.',
    },
    logout: {
        vi: 'Đăng xuất',
        en: 'Sign Out',
    },
};

export function getText(language: Language, key: string): string {
    return translations[key]?.[language] || key;
}

export function getAvailableLanguages(): Language[] {
    return ['vi', 'en'];
}
