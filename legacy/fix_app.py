import re

with open("app.js", "r", encoding="utf-8") as f:
    content = f.read()

new_func = r"""function generateReport() {
    let t = "ESTUDIO ECODOPPLER DE VASOS DE CUELLO\n\n";
    
    const paciente = document.getElementById('paciente_id').value.trim();
    const edad = document.getElementById('edad').value.trim();
    const fecha = document.getElementById('fecha').value.trim();
    
    if (paciente) t += `Paciente: ${paciente}\n`;
    if (edad) t += `Edad: ${edad} años\n`;
    if (fecha) t += `Fecha: ${fecha}\n`;
    if (paciente || edad || fecha) t += "\n";

    // --- 1. ANATOMÍA Y PAREDES ---
    const dPlaca = document.getElementById('d_placa_tipo').value;
    const iPlaca = document.getElementById('i_placa_tipo').value;
    const dDesc = document.getElementById('d_placa_desc').value.trim();
    const iDesc = document.getElementById('i_placa_desc').value.trim();
    const dImt = document.getElementById('d_imt').value;
    const iImt = document.getElementById('i_imt').value;

    t += "Calibres arteriales de las arterias carótidas bilaterales conservados.\n";

    let txtImt = "";
    if (dImt || iImt) {
        txtImt += "Valores del complejo íntima-media (GIM): ";
        if (dImt) txtImt += `derecho ${dImt} mm`;
        if (dImt && iImt) txtImt += " e ";
        if (iImt) txtImt += `izquierdo ${iImt} mm`;
        txtImt += ".\n";
        t += txtImt;
    }

    function describirPared(lado, tipo, desc) {
        let ladoTxt = lado === 'd' ? "A derecha" : "A izquierda";
        let descTxt = desc ? desc : "el bulbo carotídeo";
        
        if (tipo === 'normal') return "";
        if (tipo === 'esclerosis') return ""; 
        if (tipo === 'oclusion') return `- ${ladoTxt} se visualiza OCLUSIÓN TOTAL de la arteria carótida interna, observándose material ecogénico ocupando la totalidad de la luz.\n`;
        if (tipo === 'stent') return `- ${ladoTxt} se visualiza STENT carotídeo normoinserto, con adecuada aposición a las paredes y luz permeable.\n`;
        
        let nombrePlaca = tipo === 'fibrocalcica' ? "placa fibrocálcica" : (tipo === 'ulcerada' ? "placa complicada/ulcerada" : "placa ateromatosa blanda/mixta");
        return `- ${ladoTxt} se observa una ${nombrePlaca} a nivel de ${descTxt}.\n`;
    }

    let textoParedes = "";
    // Caso: Ambos sanos o seniles
    if ((dPlaca === 'normal' || dPlaca === 'esclerosis') && (iPlaca === 'normal' || iPlaca === 'esclerosis')) {
        if (dPlaca === 'esclerosis' || iPlaca === 'esclerosis') {
            textoParedes = "Las paredes arteriales presentan induración y aumento difuso de ecogenicidad (fibroesclerosis) y cambios involutivos seniles sin placas focales significativas.\n\n";
        } else {
            textoParedes = "Las paredes arteriales se observan regulares, sin evidencia de placas ateromatosas ni alteraciones estructurales.\n\n";
        }
    } else {
        // Caso Patológico
        textoParedes = "Las paredes arteriales presentan cambios estructurales:\n";
        textoParedes += describirPared('d', dPlaca, dDesc);
        textoParedes += describirPared('i', iPlaca, iDesc);
        textoParedes += "\n";
    }
    t += textoParedes;

    // --- 2. HEMODINAMIA ---
    const dGrado = document.getElementById('d_grado_estenosis').value;
    const iGrado = document.getElementById('i_grado_estenosis').value;
    
    let textoHemo = "";

    // If both are normal or leve
    if ((dGrado === 'normal' || dGrado === 'leve') && (iGrado === 'normal' || iGrado === 'leve')) {
        textoHemo = "Las velocidades de flujo se encuentran dentro de parámetros normales, con morfología espectral fisiológica y ausencia de aliasing.\n\n";
    } else {
        textoHemo = "En la evaluación hemodinámica:\n";
        
        // DERECHA
        let dVsp = document.getElementById('d_vsp_ci').value;
        let dRatio = document.getElementById('d_ratio').value;

        if (dPlaca === 'oclusion') {
            textoHemo += "- Eje DERECHO: Ausencia de señal Doppler espectral y color (Oclusión).\n";
        } else if (dGrado !== 'normal' && dGrado !== 'leve') {
            textoHemo += `- Eje DERECHO: Velocidades patológicas (VPS ACI ${dVsp} cm/s, Ratio ${dRatio}) con aliasing y turbulencia.\n`;
        } else {
            textoHemo += "- Eje DERECHO: Flujos conservados.\n";
        }

        // IZQUIERDA
        let iVsp = document.getElementById('i_vsp_ci').value;
        let iRatio = document.getElementById('i_ratio').value;

        if (iPlaca === 'oclusion') {
            textoHemo += "- Eje IZQUIERDO: Ausencia de señal Doppler espectral y color (Oclusión).\n";
        } else if (iGrado !== 'normal' && iGrado !== 'leve') {
            textoHemo += `- Eje IZQUIERDO: Velocidades patológicas (VPS ACI ${iVsp} cm/s, Ratio ${iRatio}) con aliasing y turbulencia.\n`;
        } else {
            textoHemo += "- Eje IZQUIERDO: Flujos conservados.\n";
        }
        textoHemo += "\n";
    }
    t += textoHemo;

    // --- 3. CONCLUSIÓN ---
    let conclusion = "";
    if ((dGrado === 'normal' || dGrado === 'leve') && (iGrado === 'normal' || iGrado === 'leve')) {
        if (dGrado === 'leve' || iGrado === 'leve') {
            conclusion = "No se detectan signos de estenosis hemodinámicamente significativa en los ejes carotídeos explorados (enfermedad ateromatosa leve <50%).\n\n";
        } else {
            conclusion = "No se detectan signos de estenosis hemodinámicamente significativa en los ejes carotídeos explorados.\n\n";
        }
    } else {
        conclusion = "CONCLUSIÓN:\n";
        // Derecha
        if(dPlaca === 'oclusion') conclusion += "* OCLUSIÓN completa de la arteria carótida interna DERECHA.\n";
        else if(dGrado !== 'normal' && dGrado !== 'leve') conclusion += `* Estenosis Carotídea Interna DERECHA de grado ${dGrado.toUpperCase()}.\n`;
        
        // Izquierda
        if(iPlaca === 'oclusion') conclusion += "* OCLUSIÓN completa de la arteria carótida interna IZQUIERDA.\n";
        else if(iGrado !== 'normal' && iGrado !== 'leve') conclusion += `* Estenosis Carotídea Interna IZQUIERDA de grado ${iGrado.toUpperCase()}.\n`;
        
        conclusion += "\n";
    }
    t += conclusion;

    // --- 4. VERTEBRALES ---
    let vertFlujo = document.getElementById('vert_flujo').value;
    let vertDetalle = document.getElementById('vert_detalle').value;
    let txtVert = "Las arterias vertebrales se visualizan permeables, con flujos anterógrados y simétricos (Segmento V2).\n";
    
    if (vertFlujo === 'hipoplasia_d') txtVert = "Asimetría vertebral por hipoplasia de arteria DERECHA (Dominancia Izquierda).\n";
    if (vertFlujo === 'hipoplasia_i') txtVert = "Asimetría vertebral por hipoplasia de arteria IZQUIERDA (Dominancia Derecha).\n";
    if (vertFlujo === 'robo_parcial_d') txtVert = "Alteración espectral vertebral DERECHA compatible con ROBO SUBCLAVIO PARCIAL (patrón alternante).\n";
    if (vertFlujo === 'robo_parcial_i') txtVert = "Alteración espectral vertebral IZQUIERDA compatible con ROBO SUBCLAVIO PARCIAL (patrón alternante).\n";
    if (vertFlujo === 'robo_completo_d') txtVert = "Inversión espectral vertebral DERECHA compatible con ROBO SUBCLAVIO COMPLETO.\n";
    if (vertFlujo === 'robo_completo_i') txtVert = "Inversión espectral vertebral IZQUIERDA compatible con ROBO SUBCLAVIO COMPLETO.\n";
    
    if (vertDetalle) txtVert += vertDetalle + "\n";
    t += txtVert;

    document.getElementById('resultado').value = t;
}"""

content = re.sub(r'function generateReport\(\) \{.*', new_func, content, flags=re.DOTALL)

with open("app.js", "w", encoding="utf-8") as f:
    f.write(content)
