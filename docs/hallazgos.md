# Evidencia y Hallazgos Estadísticos de Minería de Datos

El sistema **FraudGuard AI** extrae automáticamente patrones de anomalía fundamentados en el análisis empírico de **15,995 transacciones procesadas**. A continuación se detalla la evidencia estadística y la interpretación de negocio de los 5 hallazgos principales.

---

## Hallazgo 1: Vulnerabilidad Temporal — Disparo del Fraude en Horario de Madrugada
- **Título:** Disparo del Fraude en Franja Nocturna (00:00 a 05:59 hrs).
- **Descripción:** Las operaciones originadas durante las horas de la madrugada presentan un incremento estadísticamente drástico en la tasa de fraude en comparación con el horario comercial diurno.
- **Evidencia Estadística Cuantitativa:**
  - Tasa de fraude en horario nocturno (00:00 - 05:59): **18.74%**
  - Tasa de fraude en horario diurno (06:00 - 23:59): **6.22%**
  - Diferencia neta: **+12.52 puntos porcentuales**
  - Multiplicador de riesgo relativo: **3.01x**
- **Interpretación Pericial de Negocio:**
  Los ciberdelincuentes concentran ataques en ventanas de baja supervisión personal para evitar que la víctima note la notificación push del banco o active el bloqueo inmediato de su tarjeta.

---

## Hallazgo 2: Disparidad de Monto — Multiplicador Crítico sobre el Gasto Histórico
- **Título:** Desviación Severa del Importe Transaccional vs Promedio del Tarjetahabiente.
- **Descripción:** Cuando el valor de una transacción supera 3 veces el monto promedio histórico del cliente, la probabilidad de fraude se multiplica.
- **Evidencia Estadística Cuantitativa:**
  - Tasa de fraude para transacciones con `monto_vs_promedio > 3.0`: **24.81%**
  - Tasa de fraude para transacciones con `monto_vs_promedio <= 3.0`: **5.14%**
  - Diferencia neta: **+19.67 puntos porcentuales**
  - Multiplicador de riesgo relativo: **4.83x**
- **Interpretación Pericial de Negocio:**
  Al comprometer una credencial, el atacante busca maximizar la extracción monetaria mediante compras de alto valor antes de que los filtros de contención de la pasarela bloqueen la cuenta.

---

## Hallazgo 3: Reiteración de Intentos Rechazados Consecutivos
- **Título:** Correlación entre Fallos Previos de Autenticación y Ataques Sistemáticos.
- **Descripción:** Dos o más intentos fallidos consecutivos en la misma sesión o ventana temporal inmediata actúan como bandera roja de alta confianza.
- **Evidencia Estadística Cuantitativa:**
  - Tasa de fraude con `failed_attempts >= 2`: **28.45%**
  - Tasa de fraude con 0 intentos fallidos: **5.32%**
  - Diferencia neta: **+23.13 puntos porcentuales**
  - Multiplicador de riesgo relativo: **5.35x**
- **Interpretación Pericial de Negocio:**
  La reiteración de rechazos refleja técnicas automatizadas de prueba de CVV, credential stuffing o pruebas de vigencia de números robados en pasarelas de pago.

---

## Hallazgo 4: Ruptura del Perfil Geoespacial
- **Título:** Desplazamiento Geográfico Anómalo Superior a 100 km.
- **Descripción:** Transacciones registradas en ciudades o coordenadas distantes de la residencia habitual del cliente registran una probabilidad sustancialmente más elevada de fraude.
- **Evidencia Estadística Cuantitativa:**
  - Tasa de fraude con `distance_from_usual_location > 100 km`: **19.12%**
  - Tasa de fraude con `distance_from_usual_location <= 50 km`: **6.40%**
  - Diferencia neta: **+12.72 puntos porcentuales**
  - Multiplicador de riesgo relativo: **2.99x**
- **Interpretación Pericial de Negocio:**
  El uso de tarjetas en terminales físicas remotas o compras online forzadas a terminales fuera de la región habitual del titular indica suplantación o clonación transfronteriza.

---

## Hallazgo 5: Segmentación Sectorial y Categorías de Alta Liquidez
- **Título:** Concentración de Fraude en Comercios de Electrónica, Viajes y Apuestas.
- **Descripción:** Comercios de alta liquidez y fácil reventa en mercados secundarios presentan una tasa de fraude significativamente mayor que supermercados o farmacias.
- **Evidencia Estadística Cuantitativa:**
  - Tasa de fraude en sectores de alto riesgo (`electronics`, `gambling`, `travel`): **13.65%**
  - Tasa de fraude en sectores cotidianos (`supermarket`, `restaurants`, `retail`): **5.80%**
  - Diferencia neta: **+7.85 puntos porcentuales**
  - Multiplicador de riesgo relativo: **2.35x**
- **Interpretación Pericial de Negocio:**
  Los defraudadores priorizan bienes de consumo rápido, pasajes aéreos o recargas de apuestas deportivas que puedan liquidarse rápidamente en efectivo antes de ser canceladas por el banco emisor.
