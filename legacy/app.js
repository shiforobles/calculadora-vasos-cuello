document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('fecha').value = new Date().toLocaleDateString('es-AR');

    // Attach event listeners
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', calculateAll);
        input.addEventListener('change', calculateAll);
    });

    // Handle Plaque Panel Toggle
    document.getElementsByName('d_has_plaque').forEach(r => r.addEventListener('change', togglePlaquePanels));
    document.getElementsByName('i_has_plaque').forEach(r => r.addEventListener('change', togglePlaquePanels));
    document.getElementById('d_especial').addEventListener('change', togglePlaquePanels);
    document.getElementById('i_especial').addEventListener('change', togglePlaquePanels);

    document.getElementById('btn-reset').addEventListener('click', () => {
        if (confirm("¿Seguro que desea borrar todos los datos?")) location.reload();
    });

    document.getElementById('btn-copy').addEventListener('click', () => {
        const result = document.getElementById('resultado');
        result.select();
        document.execCommand('copy');
        const toast = document.getElementById('copy-toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    });

    document.getElementById('btn-generate').addEventListener('click', generateReport);

    togglePlaquePanels();
    calculateAll();
});

function togglePlaquePanels() {
    // Derecha
    const dEspecial = document.getElementById('d_especial').value;
    const dHasPlaque = document.querySelector('input[name="d_has_plaque"]:checked').value === 'si';
    const dMorfRow = document.getElementById('d_normal_morfologia');
    const dPanel = document.getElementById('d_plaque_panel');

    if (dEspecial !== 'ninguno') {
        dMorfRow.style.opacity = '0.4';
        dMorfRow.style.pointerEvents = 'none';
        dPanel.classList.remove('active');
    } else {
        dMorfRow.style.opacity = '1';
        dMorfRow.style.pointerEvents = 'auto';
        if (dHasPlaque) dPanel.classList.add('active');
        else dPanel.classList.remove('active');
    }

    // Izquierda
    const iEspecial = document.getElementById('i_especial').value;
    const iHasPlaque = document.querySelector('input[name="i_has_plaque"]:checked').value === 'si';
    const iMorfRow = document.getElementById('i_normal_morfologia');
    const iPanel = document.getElementById('i_plaque_panel');

    if (iEspecial !== 'ninguno') {
        iMorfRow.style.opacity = '0.4';
        iMorfRow.style.pointerEvents = 'none';
        iPanel.classList.remove('active');
    } else {
        iMorfRow.style.opacity = '1';
        iMorfRow.style.pointerEvents = 'auto';
        if (iHasPlaque) iPanel.classList.add('active');
        else iPanel.classList.remove('active');
    }
}

function calculateAll() {
    evalSide('d');
    evalSide('i');
}

function evalSide(side) {
    const especial = document.getElementById(`${side}_especial`).value;
    const hasPlaque = document.querySelector(`input[name="${side}_has_plaque"]:checked`).value === 'si';
    const box = document.getElementById(`${side}_velocidades_box`);
    const statusBox = document.getElementById(`${side}_status`);
    const gradoHidden = document.getElementById(`${side}_grado_estenosis`);
    const ratioField = document.getElementById(`${side}_ratio`);

    const vspCC = parseFloat(document.getElementById(`${side}_vsp_cc`).value) || 0;
    const vspCI = parseFloat(document.getElementById(`${side}_vsp_ci`).value) || 0;
    const vdfCI = parseFloat(document.getElementById(`${side}_vdf_ci`).value) || 0;

    // Special scenarios overrides
    if (especial === 'oclusion') {
        box.style.opacity = '0.3';
        box.style.pointerEvents = 'none';
        setStatus(statusBox, gradoHidden, "OCLUSIÓN TOTAL", "status-ocl", "oclusion");
        clearVelocities(side, ratioField);
        return;
    } else if (especial === 'suboclusion') {
        box.style.opacity = '1';
        box.style.pointerEvents = 'auto';
        setStatus(statusBox, gradoHidden, "SUBOCLUSIÓN (Crítica)", "status-ocl", "suboclusion");
        return; // Fixed status, can enter string velocities
    } else {
        box.style.opacity = '1';
        box.style.pointerEvents = 'auto';
    }

    // Ratio Calculation
    let ratio = 0;
    if (vspCI > 0 && vspCC > 0) {
        ratio = vspCI / vspCC;
        ratioField.value = ratio.toFixed(1);
    } else {
        ratioField.value = '';
    }

    if (!vspCC || !vspCI) {
        setStatus(statusBox, gradoHidden, "Faltan velocidades", "status-neutral", "normal");
        return;
    }

    let statusText = "Hemodinamia Normal";
    let statusClass = "status-normal";
    let grado = "normal";

    const isStent = especial === 'stent';

    // Advanced hemodynamic logic
    if (isStent) {
        if (vspCI >= 300 || ratio >= 4.0) {
            statusText = "REESTENOSIS (Severa >=70%)"; statusClass = "status-sev"; grado = "severa";
        } else if (vspCI >= 150) {
            statusText = "REESTENOSIS (Moderada 50-69%)"; statusClass = "status-mod"; grado = "moderada";
        } else {
            statusText = "Stent Permeable (<50%)"; statusClass = "status-mild"; grado = "leve";
        }
    } else if (['diseccion', 'trombosis', 'aneurisma', 'arteritis'].includes(especial)) {
        // Evaluate structural obstruction based purely on velocities
        if (vspCI >= 230 || ratio >= 4.0 || vdfCI > 100) {
            statusText = `Patología Estructural (Patrón Severo)`; statusClass = "status-sev"; grado = "patologia_severa";
        } else {
            statusText = "Patología Estructural"; statusClass = "status-mod"; grado = "patologia_no_obstructiva";
        }
    } else {
        // NATIVE ARTERY STANDARD SRU
        if (vspCI >= 230 || ratio >= 4.0 || vdfCI > 100) {
            statusText = "SIGNIFICATIVA (>=70%)"; statusClass = "status-sev"; grado = "severa";
        } else if (vspCI >= 125 || ratio >= 2.0 || vdfCI >= 40) {
            statusText = "MODERADA (50-69%)"; statusClass = "status-mod"; grado = "moderada";
        } else if (hasPlaque) {
            statusText = "LEVE (<50%)"; statusClass = "status-mild"; grado = "leve";
        }
    }

    setStatus(statusBox, gradoHidden, statusText, statusClass, grado);
}

function clearVelocities(side, ratioField) {
    document.getElementById(`${side}_vsp_cc`).value = '';
    document.getElementById(`${side}_vsp_ci`).value = '';
    document.getElementById(`${side}_vdf_ci`).value = '';
    ratioField.value = '';
}

function setStatus(element, hiddenObj, text, className, value) {
    element.innerText = text;
    element.className = `status-indicator ${className}`;
    hiddenObj.value = value;
}

// ============== REPORT GENERATION ==============

function generateReport() {
    let t = "ESTUDIO ECODOPPLER DE VASOS DE CUELLO\n\n";

    const paciente = document.getElementById('paciente_id').value.trim();
    const edadStr = document.getElementById('edad').value.trim();
    const edad = parseInt(edadStr, 10);

    if (paciente) t += `Paciente: ${paciente}\n`;
    if (edadStr) t += `Edad: ${edadStr} años\n`;
    if (paciente || edadStr) t += "\n";

    // --- MÓDULO 1: MORFOLOGÍA ---
    const getS = (id) => document.getElementById(id).value;
    const getCh = (side) => document.querySelector(`input[name="${side}_has_plaque"]:checked`).value === 'si';

    t += "Calibres arteriales carotídeos conservados al momento de la exploración.\n";

    let txtImt = "";
    if (getS('d_imt') || getS('i_imt')) {
        txtImt += "Valores focales del complejo íntima-media (GIM): ";
        if (getS('d_imt')) txtImt += `derecho ${getS('d_imt')} mm`;
        if (getS('d_imt') && getS('i_imt')) txtImt += " e ";
        if (getS('i_imt')) txtImt += `izquierdo ${getS('i_imt')} mm`;
        txtImt += ".\n";
        t += txtImt;
    }

    function describirMorfologia(lado) {
        const ladoTxt = lado === 'd' ? "A derecha" : "A izquierda";
        const especial = getS(`${lado}_especial`);

        if (especial !== 'ninguno') {
            switch (especial) {
                case 'oclusion': return `- ${ladoTxt} se visualiza OCLUSIÓN TOTAL de la arteria carótida interna, observándose material intraluminal sin paso de flujo Doppler color ni espectral.\n`;
                case 'suboclusion': return `- ${ladoTxt} evidencia luz filiforme distal ("string sign") compatible con severa lesión tipo SUBOCLUSIÓN vascular.\n`;
                case 'stent': return `- ${ladoTxt} se divisa STENT carotídeo normoinserto, con adecuada aposición a la pared arterial.\n`;
                case 'cea': return `- ${ladoTxt} se advierten cambios anatómicos focales compatibles con post-endarterectomía.\n`;
                case 'diseccion': return `- ${ladoTxt} se evidencia colgajo íntimal / falso lumen compatible con disección vascular.\n`;
                case 'trombosis': return `- ${ladoTxt} se observa material ecogénico ocupando la luz tipo trombo agudo.\n`;
                case 'aneurisma': return `- ${ladoTxt} se constata dilatación aneurismática/ectasia focalizada.\n`;
                case 'arteritis': return `- ${ladoTxt} se evidencia engrosamiento mural concéntrico (halo) y difuso sugestivo de inflamación tipo arteritis.\n`;
            }
        }

        const hasPlaque = getCh(lado);
        if (!hasPlaque) {
            if (!isNaN(edad) && edad >= 75) {
                return `- ${ladoTxt} se aprecian ejes carotídeos elongados y dilatados por remodelado senil, de paredes ecogénicas (fibrosclerosis), sin evidencia de placas ateromatosas focales significativas.\n`;
            }
            return `- ${ladoTxt} de paredes regulares, sin evidencia de placas ateromatosas significativas.\n`;
        }

        const tipo = getS(`${lado}_placa_tipo`);
        const ap = getS(`${lado}_placa_ap`);
        const longitud = getS(`${lado}_placa_l`);
        const locId = getS(`${lado}_placa_loc`);

        // Translating Location
        let locText = "";
        if (locId === 'bulbo') locText = "en bulbo carotídeo";
        else if (locId === 'acc') locText = "en ACC distal";
        else if (locId === 'aci') locText = "en origen de ACI";
        else if (locId === 'bulbo_aci') locText = "desde bulbo extendiéndose hacia ACI";

        let tipoStr = tipo === 'blanda' ? "placa ateromatosa blanda/hipoecogénica (vulnerable)" : (tipo === 'fibrocalcica' ? "placa fibrocálcica acústicamente densa (estable)" : "placa irregular/complicada (vulnerable)");

        let medidaStr = "";
        if (ap && longitud) medidaStr = ` de ${ap} x ${longitud} cm`;
        else if (ap) medidaStr = ` de ${ap} cm de espesor`;
        else if (longitud) medidaStr = ` de ${longitud} cm de extensión`;

        return `- ${ladoTxt} se observa ${tipoStr}${medidaStr} localizada ${locText}.\n`;
    }

    let textoParedes = "";
    if (!getCh('d') && !getCh('i') && getS('d_especial') === 'ninguno' && getS('i_especial') === 'ninguno') {
        if (!isNaN(edad) && edad >= 75) {
            textoParedes = "Ejes carotídeos bilaterales elongados y difusamente dilatados por remodelado senil, con paredes ecogénicas (fibrosclerosis), sin evidencia de placas ateromatosas focales.\n";
        } else {
            textoParedes = "Ejes carotídeos bilaterales de paredes regulares, sin evidencia de placas ateromatosas significativas.\n";
        }
    } else {
        textoParedes = "En la exploración parietal detallada:\n";
        textoParedes += describirMorfologia('d');
        textoParedes += describirMorfologia('i');
    }
    t += textoParedes;

    // --- MÓDULO 2: HEMODINAMIA ---
    const dGrado = getS('d_grado_estenosis');
    const iGrado = getS('i_grado_estenosis');
    const dFlujoCC = getS('d_flujo_cc');
    const iFlujoCC = getS('i_flujo_cc');

    function dFlujoTxt(val) {
        if (val === 'parvus') return "Patrón parvus et tardus en ACC sugestivo de fuerte lesión proximal limitante.";
        if (val === 'ar') return "Patrón de alta resistencia en ACC por alta impedancia obstructiva distal.";
        return "";
    }

    let textoHemo = "";
    const dEspHemo = getS('d_especial');
    const iEspHemo = getS('i_especial');

    if (dGrado === 'normal' && iGrado === 'normal' && dEspHemo === 'ninguno' && iEspHemo === 'ninguno' && dFlujoCC === 'normal' && iFlujoCC === 'normal') {
        textoHemo = "Velocidades de flujo normales y simétricas en ambos territorios carotídeos, con patrón espectral conservado.\n";
    } else {
        textoHemo = "En la evaluación hemodinámica de las velocidades sistólicas focales:\n";
        // Derecha Hemo
        const dVsp = getS('d_vsp_ci');
        const dRatio = getS('d_ratio');
        let dExtra = dFlujoTxt(dFlujoCC);

        if (dEspHemo === 'oclusion') textoHemo += `- Eje DERECHO: Ausencia de flujo. ${dExtra}\n`;
        else if (dEspHemo === 'suboclusion') textoHemo += `- Eje DERECHO: Flujo residual filiforme (VPS ${dVsp} cm/s) por suboclusión. ${dExtra}\n`;
        else if (dGrado === 'normal') textoHemo += `- Eje DERECHO: Velocidades dentro de la normalidad. ${dExtra}\n`;
        else if (dGrado === 'leve') textoHemo += `- Eje DERECHO: Aceleración leve sin límite quirúrgico (VPS ${dVsp} cm/s). ${dExtra}\n`;
        else if (dGrado === 'moderada') textoHemo += `- Eje DERECHO: Criterios por hemodinamia de lesión Moderada (VPS ${dVsp} cm/s, Ratio ${dRatio}). ${dExtra}\n`;
        else textoHemo += `- Eje DERECHO: Criterios por hemodinamia de lesión SEVERA (VPS ${dVsp} cm/s, Ratio ${dRatio}) con turbulencia franca. ${dExtra}\n`;

        // Izquierda Hemo
        const iVsp = getS('i_vsp_ci');
        const iRatio = getS('i_ratio');
        let iExtra = dFlujoTxt(iFlujoCC);

        if (iEspHemo === 'oclusion') textoHemo += `- Eje IZQUIERDO: Ausencia de flujo. ${iExtra}\n`;
        else if (iEspHemo === 'suboclusion') textoHemo += `- Eje IZQUIERDO: Flujo residual filiforme (VPS ${iVsp} cm/s) por suboclusión. ${iExtra}\n`;
        else if (iGrado === 'normal') textoHemo += `- Eje IZQUIERDO: Velocidades dentro de la normalidad. ${iExtra}\n`;
        else if (iGrado === 'leve') textoHemo += `- Eje IZQUIERDO: Aceleración leve sin límite quirúrgico (VPS ${iVsp} cm/s). ${iExtra}\n`;
        else if (iGrado === 'moderada') textoHemo += `- Eje IZQUIERDO: Criterios por hemodinamia de lesión Moderada (VPS ${iVsp} cm/s, Ratio ${iRatio}). ${iExtra}\n`;
        else textoHemo += `- Eje IZQUIERDO: Criterios por hemodinamia de lesión SEVERA (VPS ${iVsp} cm/s, Ratio ${iRatio}) con turbulencia franca. ${iExtra}\n`;
    }

    t += textoHemo;

    // --- SECTOR VERTEBROBASILAR ---
    let vertFlujo = getS('vert_flujo');
    if (vertFlujo === 'normal') {
        t += "Sector vertebrobasilar permeable, de características simétricas y flujo anterógrado habitual.\n";
    } else {
        const vertOp = document.getElementById('vert_flujo');
        t += "Sector vertebrobasilar: " + vertOp.options[vertOp.selectedIndex].text + ".\n";
    }

    // --- MÓDULO 3: CONCLUSIÓN PRÁCTICA CLÍNICA ---
    let conclusion = "\nCONCLUSIÓN / ALGORITMO CLÍNICO:\n";

    function getConclusionText(lado, grado, especial, hasPlaque, tipoPlaca) {
        if (especial === 'oclusion') return `Oclusión Total de ${lado} (Ausencia de señal Doppler - Estenosis 100%).`;
        if (especial === 'suboclusion') return `Lesión tipo Suboclusión (String sign) crítica de ${lado} - Velocidades variables desfiladero de flujo al color.`;
        if (['diseccion', 'trombosis', 'aneurisma', 'arteritis'].includes(especial)) {
            return `Hallazgos de ${especial.toUpperCase()} en ${lado} - Requiere valoración urgente / seguimiento estricto.`;
        }
        if (especial === 'stent') {
            if (grado === 'severa') return `REESTENOSIS Intra-Stent SEVERA en ${lado} (Sugiere reintervención/angiografía).`;
            if (grado === 'moderada') return `REESTENOSIS Intra-Stent Moderada en ${lado}.`;
            return `Stent ${lado} complaciente sin obstruciones hemodinámicas.`;
        }
        if (especial === 'cea') {
            if (grado === 'severa') return `REESTENOSIS Post-Endarterectomía SEVERA en ${lado}.`;
            return `Área Endarterectomizada ${lado} permeable.`;
        }

        // Standard Atherosclerosis
        let tipoDesc = "";
        if (tipoPlaca === 'fibrocalcica') tipoDesc = "Placa fibrocálcica estable";
        else if (tipoPlaca === 'blanda') tipoDesc = "Placa hipoecogénica vulnerable";
        else if (tipoPlaca === 'ulcerada') tipoDesc = "Placa irregular/ulcerada (vulnerable)";

        let vulnDesc = "";
        if (tipoPlaca === 'blanda' || tipoPlaca === 'ulcerada') {
            vulnDesc = "a expensas de placa hipoecoica/ulcerada (vulnerable), compatible con potencial fuente embolígena";
        } else if (tipoPlaca === 'fibrocalcica') {
            vulnDesc = "a expensas de placa estable calcificada";
        }

        if (grado === 'severa') return `Estenosis Aterosclerótica SEVERA (\u226570%) en ${lado} ${vulnDesc}. Criterios hemodinámicos quirúrgicos alcanzados (VPS > 230 cm/s / Ratio > 4.0).`;
        if (grado === 'moderada') return `Estenosis Aterosclerótica Moderada (50-69%) en ${lado} ${vulnDesc}.`;

        if (hasPlaque) {
            let base = `Enfermedad Aterosclerótica Carotídea en ${lado} (${tipoDesc}, sin estenosis hemodinámicamente significativa - <50%).`;
            if (tipoPlaca === 'blanda' || tipoPlaca === 'ulcerada') {
                base += " Morfología de vulnerabilidad anatómica: evaluar riesgo embolígeno.";
            }
            return base;
        }
        return null;
    }

    const dEsp = getS('d_especial');
    const iEsp = getS('i_especial');
    const dTipo = getS('d_placa_tipo');
    const iTipo = getS('i_placa_tipo');

    let cD = getConclusionText("eje DERECHO", dGrado, dEsp, getCh('d'), dTipo);
    let cI = getConclusionText("eje IZQUIERDO", iGrado, iEsp, getCh('i'), iTipo);

    if (!cD && !cI) {
        if (!isNaN(edad) && edad >= 75) {
            conclusion += "* Cambios morfológicos difusos tipo Fibrosclerosis y Remodelado Senil bilateral.\n* Ausencia de placas ateromatosas obstructivas / Velocidades Doppler conservadas.\n";
        } else {
            conclusion += "* Estudio dentro de límites diagnósticos normales (VPS < 125 cm/s, sin placa visible).\n";
        }
    } else {
        if (cD) conclusion += `* ${cD}\n`;
        if (cI) conclusion += `* ${cI}\n`;

        if ((getCh('d') || getCh('i')) && (dEsp === 'ninguno' && iEsp === 'ninguno')) {
            conclusion += "* Nota Clínica: La sola presencia de placas ateromatosas documentadas establece diagnóstico de Enfermedad Ateromatosa Periférica (Marcador de alto RCV sistémico).\n";
        }
    }

    t += conclusion;

    document.getElementById('resultado').value = t;
}