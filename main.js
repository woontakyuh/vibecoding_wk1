/**
 * 척추 증상 자가진단 시스템
 * - 증상 기반 진단 로직
 * - 치료 방법 안내
 * - 진료 예약 연결
 */

// ===== 척추 질환 데이터베이스 =====
const spineConditions = {
    cervical_disc: {
        name: "목디스크 (경추 추간판 탈출증)",
        description: "목뼈 사이의 디스크가 탈출하여 신경을 압박하는 질환입니다.",
        symptoms: ["neck", "shoulder", "pain", "numbness", "radiating", "weakness"],
        triggers: ["sitting", "bending", "coughing"],
        treatments: [
            "약물치료: 소염진통제, 근이완제 처방",
            "물리치료: 견인치료, 온열치료, 전기치료",
            "주사치료: 경추 신경차단술, 경막외 주사",
            "시술: 경추 신경성형술, 고주파 치료",
            "수술: 심한 경우 인공디스크 치환술 또는 경추 유합술"
        ],
        severity: "moderate"
    },
    lumbar_disc: {
        name: "허리디스크 (요추 추간판 탈출증)",
        description: "허리뼈 사이의 디스크가 탈출하여 좌골신경을 압박하는 질환입니다.",
        symptoms: ["lower_back", "leg", "pain", "numbness", "radiating", "weakness"],
        triggers: ["sitting", "bending", "lifting", "coughing"],
        treatments: [
            "약물치료: 소염진통제, 신경안정제 처방",
            "물리치료: 허리 견인치료, 운동치료",
            "주사치료: 요추 경막외 스테로이드 주사, 신경차단술",
            "시술: 신경성형술, 풍선확장술, 내시경 시술",
            "수술: 미세현미경 디스크 제거술, 내시경 디스크 제거술"
        ],
        severity: "moderate"
    },
    spinal_stenosis: {
        name: "척추관 협착증",
        description: "척추관이 좁아져서 신경이 압박되는 질환으로, 주로 퇴행성 변화로 발생합니다.",
        symptoms: ["lower_back", "leg", "pain", "numbness", "walking_difficulty", "stiffness"],
        triggers: ["standing", "walking"],
        treatments: [
            "약물치료: 소염진통제, 혈액순환 개선제",
            "물리치료: 허리 굴곡 운동, 수중치료",
            "주사치료: 경막외 주사, 신경차단술",
            "시술: 풍선확장술, 신경성형술",
            "수술: 척추 감압술, 척추 유합술"
        ],
        severity: "moderate"
    },
    spondylolisthesis: {
        name: "척추전방전위증",
        description: "척추뼈가 앞으로 미끄러진 상태로, 불안정성과 신경 압박을 유발합니다.",
        symptoms: ["lower_back", "leg", "pain", "stiffness"],
        triggers: ["standing", "walking", "bending"],
        treatments: [
            "보존적 치료: 허리 보조기 착용, 코어 근력 강화 운동",
            "물리치료: 척추 안정화 운동, 도수치료",
            "주사치료: 신경차단술, 인대 강화 주사",
            "수술: 심한 경우 척추 유합술"
        ],
        severity: "moderate"
    },
    myofascial_pain: {
        name: "근막통증 증후군",
        description: "근육과 근막에 통증 유발점이 생겨 만성적인 통증을 유발하는 질환입니다.",
        symptoms: ["neck", "shoulder", "upper_back", "pain", "stiffness"],
        triggers: ["sitting", "morning", "stress"],
        treatments: [
            "물리치료: 온열치료, 전기치료, 초음파치료",
            "도수치료: 근막이완술, 마사지",
            "주사치료: 트리거포인트 주사, 프롤로치료",
            "생활관리: 자세 교정, 정기적인 스트레칭, 스트레스 관리"
        ],
        severity: "mild"
    },
    degenerative_spine: {
        name: "퇴행성 척추 질환",
        description: "나이가 들면서 척추의 구조물들이 노화되어 발생하는 질환군입니다.",
        symptoms: ["lower_back", "upper_back", "pain", "stiffness"],
        triggers: ["morning", "standing", "walking", "lifting"],
        treatments: [
            "약물치료: 소염진통제, 연골보호제",
            "물리치료: 운동치료, 온열치료",
            "주사치료: 관절 내 주사, 신경차단술",
            "생활관리: 적정 체중 유지, 규칙적인 운동"
        ],
        severity: "mild"
    },
    acute_strain: {
        name: "급성 허리 염좌",
        description: "갑작스러운 동작이나 무리한 활동으로 인한 근육/인대 손상입니다.",
        symptoms: ["lower_back", "pain", "stiffness"],
        triggers: ["lifting", "bending", "sudden_onset"],
        treatments: [
            "급성기: 휴식, 냉찜질 (48시간 이내)",
            "아급성기: 온찜질, 가벼운 스트레칭",
            "약물치료: 소염진통제, 근이완제",
            "물리치료: 전기치료, 초음파치료",
            "생활관리: 올바른 자세, 점진적 활동 재개"
        ],
        severity: "mild"
    }
};

// ===== 상태 관리 =====
let currentStep = 1;
let userResponses = {
    locations: [],
    symptoms: [],
    triggers: [],
    duration: "",
    painLevel: 5,
    additional: []
};

// ===== 초기화 =====
document.addEventListener("DOMContentLoaded", function() {
    initPainSlider();
    initDatePicker();
    initSmoothScroll();
});

// 통증 슬라이더 초기화
function initPainSlider() {
    const painSlider = document.getElementById("painLevel");
    const painValue = document.getElementById("painValue");

    if (painSlider && painValue) {
        painSlider.addEventListener("input", function() {
            painValue.textContent = this.value;
        });
    }
}

// 날짜 선택기 초기화 (오늘 이후만 선택 가능)
function initDatePicker() {
    const dateInput = document.getElementById("preferredDate");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.setAttribute("min", today);
    }
}

// 부드러운 스크롤
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
}

// ===== 폼 네비게이션 =====
function nextStep(step) {
    // 현재 단계의 선택 저장
    saveCurrentStepData(step);

    // 유효성 검사
    if (!validateStep(step)) {
        return;
    }

    // 다음 단계로 이동
    currentStep = step + 1;
    updateStepDisplay();
}

function prevStep(step) {
    currentStep = step - 1;
    updateStepDisplay();
}

function saveCurrentStepData(step) {
    switch(step) {
        case 1:
            userResponses.locations = getCheckedValues("location");
            break;
        case 2:
            userResponses.symptoms = getCheckedValues("symptom");
            break;
        case 3:
            userResponses.triggers = getCheckedValues("trigger");
            break;
        case 4:
            userResponses.duration = getRadioValue("duration");
            userResponses.painLevel = parseInt(document.getElementById("painLevel").value);
            userResponses.additional = getCheckedValues("additional");
            break;
    }
}

function getCheckedValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function getRadioValue(name) {
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    return radio ? radio.value : "";
}

function validateStep(step) {
    let isValid = true;
    let message = "";

    switch(step) {
        case 1:
            if (userResponses.locations.length === 0) {
                message = "통증 부위를 최소 1개 이상 선택해주세요.";
                isValid = false;
            }
            break;
        case 2:
            if (userResponses.symptoms.length === 0) {
                message = "증상을 최소 1개 이상 선택해주세요.";
                isValid = false;
            }
            break;
        case 3:
            // 악화 요인은 선택 사항
            break;
        case 4:
            if (!userResponses.duration) {
                message = "증상 기간을 선택해주세요.";
                isValid = false;
            }
            break;
    }

    if (!isValid) {
        alert(message);
    }

    return isValid;
}

function updateStepDisplay() {
    // 모든 스텝 숨기기
    document.querySelectorAll(".form-step").forEach(step => {
        step.classList.remove("active");
    });

    // 현재 스텝 표시
    const currentStepEl = document.getElementById(`step${currentStep}`);
    if (currentStepEl) {
        currentStepEl.classList.add("active");
    }

    // 진행 표시바 업데이트
    const progressFill = document.getElementById("progressFill");
    progressFill.style.width = `${(currentStep / 4) * 100}%`;

    // 스텝 인디케이터 업데이트
    document.querySelectorAll(".progress-steps .step").forEach((step, index) => {
        step.classList.remove("active", "completed");
        if (index + 1 < currentStep) {
            step.classList.add("completed");
        } else if (index + 1 === currentStep) {
            step.classList.add("active");
        }
    });
}

// ===== 진단 분석 =====
function submitDiagnosis() {
    saveCurrentStepData(4);

    if (!validateStep(4)) {
        return;
    }

    // 진단 분석 수행
    const results = analyzeDiagnosis();

    // 결과 표시
    displayResults(results);

    // 결과 섹션으로 스크롤
    document.getElementById("diagnosis").style.display = "none";
    document.getElementById("result").style.display = "block";

    setTimeout(() => {
        document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
}

function analyzeDiagnosis() {
    const scores = {};

    // 각 질환에 대한 점수 계산
    for (const [key, condition] of Object.entries(spineConditions)) {
        let score = 0;
        let matches = 0;

        // 위치 매칭 (가중치 2)
        for (const location of userResponses.locations) {
            if (condition.symptoms.includes(location)) {
                score += 2;
                matches++;
            }
        }

        // 증상 매칭 (가중치 1.5)
        for (const symptom of userResponses.symptoms) {
            if (condition.symptoms.includes(symptom)) {
                score += 1.5;
                matches++;
            }
        }

        // 악화 요인 매칭 (가중치 1)
        for (const trigger of userResponses.triggers) {
            if (condition.triggers.includes(trigger)) {
                score += 1;
                matches++;
            }
        }

        // 추가 요인
        if (userResponses.additional.includes("sudden_onset") && key === "acute_strain") {
            score += 3;
        }

        // 만성도에 따른 조정
        if (userResponses.duration === "chronic_long") {
            if (key === "spinal_stenosis" || key === "degenerative_spine") {
                score += 2;
            }
        } else if (userResponses.duration === "acute") {
            if (key === "acute_strain") {
                score += 2;
            }
        }

        // 통증 강도에 따른 조정
        if (userResponses.painLevel >= 7) {
            if (condition.severity === "moderate") {
                score += 1;
            }
        }

        // 최소 매칭 점수 필터
        if (matches >= 2) {
            scores[key] = {
                condition: condition,
                score: score,
                matches: matches
            };
        }
    }

    // 점수순으로 정렬
    const sortedResults = Object.entries(scores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 3); // 상위 3개만

    return sortedResults;
}

function displayResults(results) {
    const resultContent = document.getElementById("resultContent");
    const emergencyWarning = document.getElementById("emergencyWarning");

    // 긴급 경고 확인 (대소변 장애)
    if (userResponses.additional.includes("bladder_issue")) {
        emergencyWarning.style.display = "flex";
    } else {
        emergencyWarning.style.display = "none";
    }

    // 결과가 없는 경우
    if (results.length === 0) {
        resultContent.innerHTML = `
            <div class="result-card">
                <h4>분석 결과</h4>
                <p>입력하신 정보만으로는 특정 질환을 추정하기 어렵습니다.</p>
                <p>정확한 진단을 위해 전문의 상담을 권장드립니다.</p>
            </div>
        `;
        return;
    }

    // 결과 카드 생성
    let html = `
        <div class="summary-header">
            <h3>입력하신 증상을 분석한 결과입니다</h3>
            <p>다음과 같은 질환이 의심됩니다. 정확한 진단을 위해 전문의 상담을 권장합니다.</p>
        </div>
    `;

    // 가능성 계산
    const maxScore = results[0][1].score;

    results.forEach(([key, data], index) => {
        const probability = Math.min(Math.round((data.score / maxScore) * 100), 95);
        const probabilityText = probability >= 70 ? "높음" : probability >= 40 ? "중간" : "낮음";

        html += `
            <div class="result-card">
                <h4>
                    ${index + 1}. ${data.condition.name}
                    <span class="probability-badge">가능성 ${probabilityText}</span>
                </h4>
                <p>${data.condition.description}</p>
                <h5>권장 치료 방법</h5>
                <ul class="treatment-list">
                    ${data.condition.treatments.map(t => `<li>${t}</li>`).join("")}
                </ul>
            </div>
        `;
    });

    // 증상 요약 추가
    html += `
        <div class="result-card" style="border-left-color: var(--secondary-color);">
            <h4>입력하신 증상 요약</h4>
            <p><strong>통증 부위:</strong> ${getLocationNames(userResponses.locations)}</p>
            <p><strong>증상:</strong> ${getSymptomNames(userResponses.symptoms)}</p>
            <p><strong>악화 요인:</strong> ${getTriggerNames(userResponses.triggers)}</p>
            <p><strong>증상 기간:</strong> ${getDurationText(userResponses.duration)}</p>
            <p><strong>통증 강도:</strong> ${userResponses.painLevel}/10</p>
        </div>
    `;

    resultContent.innerHTML = html;
}

// 이름 변환 함수들
function getLocationNames(locations) {
    const names = {
        neck: "목",
        shoulder: "어깨/팔",
        upper_back: "등",
        lower_back: "허리",
        leg: "엉덩이/다리"
    };
    return locations.map(l => names[l] || l).join(", ") || "없음";
}

function getSymptomNames(symptoms) {
    const names = {
        pain: "통증",
        numbness: "저림",
        weakness: "근력 약화",
        stiffness: "뻣뻣함",
        radiating: "방사통",
        walking_difficulty: "보행 장애"
    };
    return symptoms.map(s => names[s] || s).join(", ") || "없음";
}

function getTriggerNames(triggers) {
    const names = {
        sitting: "오래 앉아있을 때",
        standing: "오래 서있을 때",
        walking: "걸을 때",
        bending: "허리 숙일 때",
        morning: "아침에",
        night: "밤에",
        lifting: "무거운 것 들 때",
        coughing: "기침할 때"
    };
    return triggers.map(t => names[t] || t).join(", ") || "특이사항 없음";
}

function getDurationText(duration) {
    const texts = {
        acute: "1주일 이내 (급성)",
        subacute: "1주~1개월",
        chronic_short: "1~3개월",
        chronic_long: "3개월 이상 (만성)"
    };
    return texts[duration] || "미선택";
}

// ===== 진단 리셋 =====
function resetDiagnosis() {
    // 상태 초기화
    currentStep = 1;
    userResponses = {
        locations: [],
        symptoms: [],
        triggers: [],
        duration: "",
        painLevel: 5,
        additional: []
    };

    // 폼 초기화
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[type="radio"]').forEach(rb => rb.checked = false);
    document.getElementById("painLevel").value = 5;
    document.getElementById("painValue").textContent = "5";

    // 화면 전환
    document.getElementById("result").style.display = "none";
    document.getElementById("diagnosis").style.display = "block";
    updateStepDisplay();

    // 진단 섹션으로 스크롤
    setTimeout(() => {
        document.getElementById("diagnosis").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
}

// ===== 질환 카드 토글 =====
function toggleDisease(card) {
    // 다른 카드 닫기
    document.querySelectorAll(".disease-card").forEach(c => {
        if (c !== card) {
            c.classList.remove("active");
        }
    });

    // 현재 카드 토글
    card.classList.toggle("active");
}

// ===== 예약 폼 제출 =====
function submitAppointment(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // 간단한 유효성 검사
    const name = formData.get("patientName");
    const phone = formData.get("patientPhone");
    const date = formData.get("preferredDate");

    if (!name || !phone || !date) {
        alert("필수 항목을 모두 입력해주세요.");
        return;
    }

    // 전화번호 형식 검사
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ""))) {
        alert("올바른 전화번호 형식을 입력해주세요.");
        return;
    }

    // 예약 정보 저장 (실제로는 서버로 전송)
    const appointmentData = {
        name: name,
        phone: phone,
        date: date,
        time: formData.get("preferredTime"),
        symptoms: formData.get("symptoms"),
        timestamp: new Date().toISOString()
    };

    console.log("예약 정보:", appointmentData);

    // 자가진단 결과가 있으면 함께 저장
    if (userResponses.locations.length > 0) {
        appointmentData.diagnosisData = userResponses;
    }

    // 로컬 스토리지에 저장 (데모용)
    saveAppointment(appointmentData);

    // 폼 초기화
    form.reset();

    // 성공 모달 표시
    document.getElementById("appointmentModal").classList.add("active");
}

function saveAppointment(data) {
    const appointments = JSON.parse(localStorage.getItem("spineAppointments") || "[]");
    appointments.push(data);
    localStorage.setItem("spineAppointments", JSON.stringify(appointments));
}

function closeModal() {
    document.getElementById("appointmentModal").classList.remove("active");
}

// 모달 외부 클릭 시 닫기
document.addEventListener("click", function(event) {
    const modal = document.getElementById("appointmentModal");
    if (event.target === modal) {
        closeModal();
    }
});

// ESC 키로 모달 닫기
document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeModal();
    }
});

// ===== 모바일 메뉴 =====
document.addEventListener("DOMContentLoaded", function() {
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const nav = document.querySelector(".nav");

    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener("click", function() {
            nav.classList.toggle("mobile-active");
            this.classList.toggle("active");
        });
    }
});

// ===== 척추 SVG 인터랙션 =====
document.addEventListener("DOMContentLoaded", function() {
    const spineSections = document.querySelectorAll(".spine-section");

    spineSections.forEach(section => {
        section.addEventListener("click", function() {
            const sectionName = this.dataset.section;
            let targetLocation = "";

            switch(sectionName) {
                case "cervical":
                    targetLocation = "neck";
                    break;
                case "thoracic":
                    targetLocation = "upper_back";
                    break;
                case "lumbar":
                    targetLocation = "lower_back";
                    break;
                case "sacral":
                    targetLocation = "leg";
                    break;
            }

            // 해당 위치의 체크박스 선택
            const checkbox = document.querySelector(`input[name="location"][value="${targetLocation}"]`);
            if (checkbox) {
                checkbox.checked = !checkbox.checked;

                // 진단 섹션으로 스크롤
                document.getElementById("diagnosis").scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
});

// ===== 자가진단 결과를 예약 폼에 자동 입력 =====
document.addEventListener("DOMContentLoaded", function() {
    const appointmentLink = document.querySelector(".btn-appointment");

    if (appointmentLink) {
        appointmentLink.addEventListener("click", function(e) {
            setTimeout(() => {
                // 증상 요약을 예약 폼의 증상 필드에 입력
                if (userResponses.locations.length > 0) {
                    const symptomsField = document.getElementById("symptoms");
                    if (symptomsField) {
                        const summary = [
                            `통증 부위: ${getLocationNames(userResponses.locations)}`,
                            `증상: ${getSymptomNames(userResponses.symptoms)}`,
                            `통증 강도: ${userResponses.painLevel}/10`,
                            `기간: ${getDurationText(userResponses.duration)}`
                        ].join("\n");

                        symptomsField.value = summary;
                    }
                }
            }, 500);
        });
    }
});
