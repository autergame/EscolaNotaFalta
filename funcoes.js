function pesquisar() {
	var Ra = document.getElementById("txtNrRa").value;
	var DigRa = document.getElementById("txtNrDigRa").value;
	var UfRa = document.getElementById("ddlUfRa").value;
	var AnoLetivo = document.getElementById("txtNrAnoLetivo").value;
	var DtNascimento = document.getElementById("txtDtNascimento");
	var SalvarDados = document.getElementById("chkSalvarDados").checked;

	if (Ra.length == 0 || DigRa.length == 0 || UfRa.length == 0 || DtNascimento.value.length == 0) {
		alert("Preencha todos os campos!");
		return;
	}

	var AnoAtual = new Date().getFullYear();

	if (AnoLetivo < 2007 || AnoLetivo > AnoAtual) {
		alert("Escolha um ano entre 2007 e " + AnoAtual);
		return;
	}

	if (SalvarDados) {
		window.localStorage.setItem("Ra", Ra);
		window.localStorage.setItem("DigRa", DigRa);
		window.localStorage.setItem("UfRa", UfRa);
		window.localStorage.setItem("AnoLetivo", AnoLetivo);
		window.localStorage.setItem("Nascimento", DtNascimento.valueAsDate);
		window.localStorage.setItem("SalvarDados", SalvarDados);
	} else {
		window.localStorage.setItem("Ra", "");
		window.localStorage.setItem("DigRa", "");
		window.localStorage.setItem("UfRa", "");
		window.localStorage.setItem("AnoLetivo", "");
		window.localStorage.setItem("Nascimento", "");
		window.localStorage.setItem("SalvarDados", "");
	}

	let loader = document.getElementById("loader");
	let loaderText = document.getElementById("loaderText");

	loader.style.marginTop = "15px";
	loader.style.display = "block";
	loaderText.style.display = "block";
	loaderText.innerText = "Espere: Carregando boletim";

	var request = new XMLHttpRequest();
	request.onload = function () {
		if (request.status == 200) {
			loader.style.marginTop = "";
			loader.style.display = "none";
			loaderText.style.display = "none";

			var dDiv = document.querySelector(".dDiv");
			while (dDiv.firstChild) {
				dDiv.removeChild(dDiv.firstChild);
			}

			var boletim = pegarBoletim(request.responseText);
			if (boletim) {
				var [escola, nome, notas, porcetagem] = analisarBoletim(boletim);
				criarTexto(dDiv, "Escola: " + escola);
				criarTexto(dDiv, "Nome: " + nome);
				criarPresenca(dDiv, porcetagem);
				criarTabela(dDiv, notas);
			} else {
				alert("As informações do boletim ainda não estão disponíveis para consulta!");
			}
		} else if (request.status == 299) {
			alert(JSON.parse(request.responseText).mensagem);
		} else {
			alert(request.responseText);
		}
	}

	var DataNascimento = DtNascimento.valueAsDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

	var parametros = "nrRa=" + Ra +
		"&nrDigRa=" + DigRa +
		"&dsUfRa=" + UfRa +
		"&dtNascimento=" + DataNascimento +
		"&nrAnoLetivo=" + AnoLetivo;
	request.open("GET", "https://sed.educacao.sp.gov.br/Boletim/GerarBoletimUnificadoExterno?" + parametros, true);
	request.send()
}

function pegarBoletim(textoRetornado) {
	var parser = new DOMParser();
	var htmlDoc = parser.parseFromString(textoRetornado, "text/html");
	var boletimJsonScript = htmlDoc.querySelector("body > script:nth-child(2)").innerHTML;
	return JSON.parse(boletimJsonScript.match(/\{.*}/g));
}

function analisarBoletim(boletim) {
	var notas = [];
	var presencaTotal = 0;
	var presencaQuatidade = 0;

	var nome = boletim.DsNome;
	var escola = boletim.TpsEnsino[0].Unidades[0].DsEscola;
	var disciplinas = boletim.TpsEnsino[0].Unidades[0].Disciplinas;

	for (var i = 0; i < disciplinas.length; i++) {
		var notaTotal = 0;
		var notaNulas = 0;
		var frequenciaTotal = 0
		var frequenciaNulas = 0;
		var frequenciaQuantidade = 0;

		var eletiva = false;
		var engajamentos = ["ET", "ES", "EP"];

		var bimestres = disciplinas[i].Bimestres;

		for (var j = 0; j < bimestres.length; j++) {
			var frequencia = parseInt(bimestres[j].DsPFrequencia.replace(/[^0-9]/g, ""), 10);
			if (!isNaN(frequencia)) {
				frequenciaTotal += frequencia;
				presencaTotal += frequencia;
				frequenciaQuantidade += 1;
				presencaQuatidade += 1;
			} else {
				frequenciaNulas += 1;
			}
			var nota = parseFloat(bimestres[j].DsNota.replace(/[^0-9.,]/g, ""));
			if (!isNaN(nota)) {
				notaTotal += nota;
			} else {
				notaNulas += 1;
			}
		}

		if (engajamentos.some(word => bimestres[0].DsNota == word) || notaTotal == 0) {
			eletiva = true;
		}

		frequenciaTotal = (frequenciaTotal / frequenciaQuantidade);
		frequenciaTotal = frequenciaTotal > 0.0 ? frequenciaTotal.toPrecision(4) : "0";

		if (notaNulas != bimestres.length || frequenciaNulas != bimestres.length) {
			var nomeDisciplina = disciplinas[i].DsDisciplina;
			notas.push({
				disciplina: nomeDisciplina,
				frequenciaTotal: frequenciaTotal,
				notaTotal: notaTotal,
				eletiva: eletiva,
			});
		}
	}

	var presenca = presencaTotal / presencaQuatidade;
	presenca = presenca > 0.0 ? presenca.toPrecision(4) : "0";

	return [escola, nome, notas, presenca];
}

function capitalizarPrimeiraLetra(texto) {
	var textoMenor = texto.toLowerCase();
	return textoMenor.charAt(0).toUpperCase() + textoMenor.slice(1);
}

function criarTexto(dDiv, texto) {
	var nDiv = document.createElement("Div");
	nDiv.className = "nDiv";

	var nH2 = document.createElement("h2");
	nH2.className = "nH2";
	nH2.textContent = texto;
	nDiv.appendChild(nH2);

	dDiv.appendChild(nDiv);
}

function criarPresenca(dDiv, presenca) {
	var pDiv = document.createElement("Div");
	pDiv.className = "pDiv";

	var pH2 = document.createElement("h2");
	pH2.className = "pH2";

	var pPre = document.createElement("pre");
	pPre.className = "pPre";
	pPre.textContent = "Porcentagem de presença: ";
	pH2.appendChild(pPre);

	pDiv.appendChild(pH2);

	var pnH2 = document.createElement("h2");
	pnH2.className = "pnH2";
	pnH2.textContent = presenca + "%";
	if (presenca >= 90) {
		pnH2.style = "color: rgb(0, 255, 0);"
	} else if (presenca >= 80) {
		pnH2.style = "color: rgb(255, 255, 0);"
	} else if (presenca < 75) {
		pnH2.style = "color: rgb(255, 0, 0);"
	}
	pDiv.appendChild(pnH2);

	dDiv.appendChild(pDiv);
}

function criarTabela(dDiv, notas) {
	notas.sort(function (a, b) {
		if (a.eletiva > b.eletiva) {
			return 1;
		}
		else if (a.eletiva < b.eletiva) {
			return -1;
		}
		return 0;
	});

	var ntTable = document.createElement("table");
	ntTable.className = "ntTable";

	var ntTr = document.createElement("tr");

	var ntThDisciplina = document.createElement("th");
	ntThDisciplina.textContent = "Disciplina";
	ntTr.appendChild(ntThDisciplina);

	var ntThFrequencia = document.createElement("th");
	ntThFrequencia.textContent = "Frequência total";
	ntTr.appendChild(ntThFrequencia);

	var ntThNota = document.createElement("th");
	ntThNota.textContent = "Nota total";
	ntTr.appendChild(ntThNota);

	var ntThead = document.createElement("thead");
	ntThead.appendChild(ntTr);

	ntTable.appendChild(ntThead);

	var ntTbody = document.createElement("tbody");

	for (var i = 0; i < notas.length; i++) {
		var tr = document.createElement("tr");

		var tdDisciplina = document.createElement("td");
		tdDisciplina.textContent = capitalizarPrimeiraLetra(notas[i].disciplina);
		tr.appendChild(tdDisciplina);

		var porcetagem = notas[i].frequenciaTotal;
		var tdFrequenciaTotal = document.createElement("td");
		tdFrequenciaTotal.textContent = porcetagem + '%';
		if (porcetagem >= 90.0) {
			tdFrequenciaTotal.style = "color: rgb(0, 255, 0);"
		} else if (porcetagem >= 80.0) {
			tdFrequenciaTotal.style = "color: rgb(255, 255, 0);"
		} else if (porcetagem < 75.0) {
			tdFrequenciaTotal.style = "color: rgb(255, 0, 0);"
		}
		tr.appendChild(tdFrequenciaTotal);

		if (!notas[i].eletiva) {
			var tdNotaTotal = document.createElement("td");
			tdNotaTotal.textContent = notas[i].notaTotal;
			tr.appendChild(tdNotaTotal);
		} else {
			var tdNotaTotal = document.createElement("td");
			tr.appendChild(tdNotaTotal);
		}

		ntTbody.appendChild(tr);
	}

	ntTable.appendChild(ntTbody);

	var ntDiv = document.createElement("Div");
	ntDiv.className = "ntDiv";
	ntDiv.appendChild(ntTable);

	dDiv.appendChild(ntDiv);
}
