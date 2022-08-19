function capitalizarPrimeiraLetra(texto) {
	var textoMenor = texto.toLowerCase();
	return textoMenor.charAt(0).toUpperCase() + textoMenor.slice(1);
}

function pesquisar() {
	var Ra = document.getElementById("txtNrRa").value;
	var DigRa = document.getElementById("txtNrDigRa").value;
	var UfRa = document.getElementById("ddlUfRa").value;
	var Nascimento = document.getElementById("txtDtNascimento").value;

	if (Ra.length == 0 || DigRa.length == 0 || UfRa.length == 0 || Nascimento.length == 0) {
		alert("Preencha todos os campos!");
		return;
	}

	window.localStorage.setItem("Ra", Ra);
	window.localStorage.setItem("DigRa", DigRa);
	window.localStorage.setItem("UfRa", UfRa);
	window.localStorage.setItem("Nascimento", Nascimento);

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

			document.querySelector(".nDiv > .nH2").textContent = "Nome: " + boletim.DsNome;
			
			var porcetagem = (porcetagemTotal / porcetagemQuatidade).toPrecision(4);
			document.querySelector(".pDiv > .pnH2").textContent = porcetagem + "%";
			if (porcetagem >= 75) {
				document.querySelector(".pDiv > .pnH2").style = "color: rgb(0, 255, 0);"
			} else {
				document.querySelector(".pDiv > .pnH2").style = "color: rgb(255, 0, 0);"
			}

			var lista = document.querySelector(".ntDiv > .ntTable > tbody");
			while (lista.firstChild) {
				lista.removeChild(lista.lastChild);
			}

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

				document.querySelector(".ntDiv > .ntTable > tbody").appendChild(tr);
			}
		} else if (request.status == 299) {
			alert(JSON.parse(request.responseText).mensagem);
		}
	}
	var parametros = "nrRa=" + Ra + "&nrDigRa=" + DigRa + "&dsUfRa=" + UfRa + "&dtNascimento=" + Nascimento + "&nrAnoLetivo=" + AnoLetivo;
	request.open("GET", "https://sed.educacao.sp.gov.br/Boletim/GerarBoletimUnificadoExterno?" + parametros, true);
	request.send()
}