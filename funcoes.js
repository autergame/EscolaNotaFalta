function capitalizarPrimeiraLetra(texto) {
	var textoMenor = texto.toLowerCase();
	return textoMenor.charAt(0).toUpperCase() + textoMenor.slice(1);
}

function formatarData(data) {
	var dia = '' + data.getDate(),
		mes = '' + (data.getMonth() + 1),
		ano = '' + data.getFullYear();
	if (dia.length < 2) dia = '0' + dia;
	if (mes.length < 2) mes = '0' + mes;
	return [dia, mes, ano].join('/');
}

function pesquisar() {
	var Ra = document.getElementById("txtNrRa").value;
	var DigRa = document.getElementById("txtNrDigRa").value;
	var UfRa = document.getElementById("ddlUfRa").value;
	var Nascimento = document.getElementById("txtDtNascimento");

	if (Ra.length == 0 || DigRa.length == 0 || UfRa.length == 0 || Nascimento.value.length == 0) {
		alert("Preencha todos os campos!");
		return;
	}

	var DataNascimento = formatarData(new Date(Nascimento.valueAsDate.toLocaleString('pt-BR', {timeZone: 'UTC'})));

	window.localStorage.setItem("Ra", Ra);
	window.localStorage.setItem("DigRa", DigRa);
	window.localStorage.setItem("UfRa", UfRa);
	window.localStorage.setItem("Nascimento", Nascimento.valueAsDate);

	var AnoLetivo = new Date().getFullYear().toString();

	var request = new XMLHttpRequest();
	request.onload = function () {
		if (request.status == 200) {
			var parser = new DOMParser();
			var htmlDoc = parser.parseFromString(request.responseText, "text/html");
			var boletimJsonScript = htmlDoc.querySelector("body > script:nth-child(2)").innerHTML;
			var boletim = JSON.parse(boletimJsonScript.match(/\{.*}/g));

			var notas = [];
			var porcetagemTotal = 0;
			var porcetagemQuatidade = 0;
			var disciplinas = boletim.TpsEnsino[0].Unidades[0].Disciplinas;

			for (var i = 0; i < disciplinas.length; i++) {
				var notaTotal = 0;
				var notasNulas = 0;
				var frequenciaNulas = 0;
				var engajamentos = ["ET", "ES", "EP"];
				var bimestres = disciplinas[i].Bimestres;

				for (var j = 0; j < bimestres.length; j++) {
					var frequencia = parseInt(bimestres[j].DsPFrequencia.replace(/[^0-9]/g, ""), 10);
					if (!isNaN(frequencia)) {
						porcetagemTotal += frequencia;
						porcetagemQuatidade += 1;
					} else {
						frequenciaNulas += 1;
					}
					var nota = parseFloat(bimestres[j].DsNota.replace(/[^0-9.]/g, ""));
					if (!isNaN(nota)) {
						notaTotal += nota;
					} else {
						notasNulas += 1;
					}
				}

				if (engajamentos.some(word => bimestres[0].DsNota == word) == false) {
					if (notasNulas != bimestres.length && frequenciaNulas != bimestres.length) {
						var nomeDisciplina = disciplinas[i].DsDisciplina;
						notas.push({
							disciplina: capitalizarPrimeiraLetra(nomeDisciplina),
							notaTotal: notaTotal,
							passou: notaTotal >= 20,
						});
					}
				}
			}

			var nDiv = document.querySelector(".nDiv");

			var nH2 = document.createElement("h2");
			nH2.className = "nH2";
			nH2.textContent = "Nome: " + boletim.DsNome;
			nDiv.appendChild(nH2);

			var porcetagem = (porcetagemTotal / porcetagemQuatidade).toPrecision(4);

			var pDiv = document.querySelector(".pDiv");

			var pH2 = document.createElement("h2");
			pH2.className = "pH2";

			var pPre = document.createElement("pre");
			pPre.className = "pPre";
			pPre.textContent = "Porcentagem de presença: ";
			pH2.appendChild(pPre);

			pDiv.appendChild(pH2);

			var pnH2 = document.createElement("h2");
			pnH2.className = "pnH2";
			pnH2.textContent = porcetagem + "%";
			if (porcetagem >= 75) {
				pnH2.style = "color: rgb(0, 255, 0);"
			} else {
				pnH2.style = "color: rgb(255, 0, 0);"
			}
			pDiv.appendChild(pnH2);

			var mostrarPrecisa = false;
			for (var i = 0; i < notas.length; i++) {
				if (notas[i].passou == false) {
					mostrarPrecisa = true;
					break;
				}
			}

			var ntDiv = document.querySelector(".ntDiv");

			var ntTable = document.createElement("table");
			ntTable.className = "ntTable";

			var ntTr = document.createElement("tr");

			var ntThDisciplina = document.createElement("th");
			ntThDisciplina.textContent = "Disciplina";
			ntTr.appendChild(ntThDisciplina);

			var ntThNota = document.createElement("th");
			ntThNota.textContent = "Nota total";
			ntTr.appendChild(ntThNota);

			var ntThPassou = document.createElement("th");
			ntThPassou.textContent = "Passou";
			ntTr.appendChild(ntThPassou);

			if (mostrarPrecisa) {
				var ntThPrecisa = document.createElement("th");
				ntThPrecisa.textContent = "Precisa";
				ntTr.appendChild(ntThPrecisa);
			}

			var ntThead = document.createElement("thead");
			ntThead.appendChild(ntTr);
			ntTable.appendChild(ntThead);

			var ntTbody = document.createElement("tbody");

			for (var i = 0; i < notas.length; i++) {
				var tr = document.createElement("tr");

				var tdDisciplina = document.createElement("td");
				tdDisciplina.textContent = notas[i].disciplina;
				tr.appendChild(tdDisciplina);

				var tdNotaTotal = document.createElement("td");
				tdNotaTotal.textContent = notas[i].notaTotal;
				tr.appendChild(tdNotaTotal);

				var tdPassou = document.createElement("td");
				tdPassou.textContent = notas[i].passou ? "Sim" : "Não";
				if (notas[i].passou) {
					tdPassou.style = "background-color: rgb(0, 128, 0);"
				} else {
					tdPassou.style = "background-color: rgb(128, 0, 0);"
				}
				tr.appendChild(tdPassou);

				if (mostrarPrecisa) {
					var tdPrecisa = document.createElement("td");
					var precisa = 20 - notas[i].notaTotal;
					if (precisa > 0) {
						tdPrecisa.textContent = precisa;
					}
					tr.appendChild(tdPrecisa);
				}

				ntTbody.appendChild(tr);
			}

			ntTable.appendChild(ntTbody);
			ntDiv.appendChild(ntTable);
		} else if (request.status == 299) {
			alert(JSON.parse(request.responseText).mensagem);
		}
	}
	var parametros = "nrRa=" + Ra + "&nrDigRa=" + DigRa + "&dsUfRa=" + UfRa + "&dtNascimento=" + DataNascimento + "&nrAnoLetivo=" + AnoLetivo;
	request.open("GET", "https://sed.educacao.sp.gov.br/Boletim/GerarBoletimUnificadoExterno?" + parametros, true);
	request.send()
}
