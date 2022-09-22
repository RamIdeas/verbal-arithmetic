<script lang="ts">
	let number1 = getRandomNumber();
	let number2 = getRandomNumber();
	let operator = getRandomOperator();
	let answer = '';
	let score = 0;
	let skips = 0;
	let highscore = parseInt(globalThis.localStorage?.getItem('highscore') ?? '0', 10);
	let status: Status = 'initial';
	let recognition: SpeechRecognition;

	$: if (score > highscore) globalThis.localStorage?.setItem('highscore', score.toString());

	type Operator = '+' | '-' | '×' | '÷';
	type Status = 'initial' | 'question';

	function getRandomOperator() {
		const operators: Operator[] = ['+', '-', '×', '÷'];
		return operators[Math.floor(Math.random() * 4)];
	}
	function getRandomNumber(max = 99, min = 2) {
		return Math.floor(Math.random() * max) + min;
	}
	function generateQuestion() {
		while (true) {
			const n1 = getRandomNumber();
			const n2 = getRandomNumber();
			const op = getRandomOperator();
			const fn = fns[op];
			const correctAnswer = fn(n1, n2);
			const isInt = Number.isInteger(correctAnswer);
			const isReasonable = correctAnswer > 0 && correctAnswer <= 999;

			if (!isInt || !isReasonable) continue;

			// console.log(`${n1} ${op} ${n2} = ${correctAnswer}`);
			[number1, number2, operator] = [n1, n2, op];
			return;
		}
	}

	function onClickInit() {
		initSpeechRecognition();
		generateQuestion();

		if (status === 'initial') status = 'question';
	}
	function initSpeechRecognition() {
		const SpeechRecognition: typeof webkitSpeechRecognition =
			webkitSpeechRecognition || globalThis.SpeechRecognition;

		recognition?.abort();
		recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		// recognition.grammars = new webkitSpeechGrammarList();
		// recognition.grammars.addFromString(
		// 	'#JSGF V1.0; grammar numbers; public <number> = zero | one | two | three | four | five | six | seven | eight | nine | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 ;',
		// 	1
		// );

		// recognition.addEventListener('start', function () {
		// 	console.log('recognition.start');
		// 	console.time('recognition');
		// });
		recognition.addEventListener('result', function (event) {
			// if (event.results.item(0).item(0).confidence > 0.5) console.timeEnd('voice');
			// console.log(
			// 	'recognition.result',
			// 	event.results.length,
			// 	event.results.item(0).item(0).transcript,
			// 	event.results.item(0).item(0).confidence
			// );

			let result = event.results.item(event.resultIndex).item(0).transcript;

			if (result.includes('clear')) {
				initSpeechRecognition();
				answer = '';
				return;
			}

			if (result.includes('skip')) {
				skipQuestion();
				return;
			}

			if (result.includes('answer')) {
				submitAnswer();
				return;
			}

			result = result
				.replaceAll(
					/one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eightteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety/gi,
					(match) => numbers[match.toLowerCase()] ?? match.toLowerCase()
				)
				.replaceAll(/\D/g, '');

			answer = result;
		});
		// recognition.addEventListener('error', function (event) {
		// 	console.log('recognition.error');
		// });
		// recognition.addEventListener('end', function () {
		// 	console.log('recognition.end');
		// 	console.timeEnd('recognition');
		// });

		recognition.start();
	}

	function submitAnswer() {
		if (!answer) return;

		const fn = fns[operator];
		const correctAnswer = fn(number1, number2);
		const parsedAnswer = parseInt(answer, 10);
		const isCorrect = parsedAnswer === correctAnswer;

		console.log(`${parsedAnswer} is ${isCorrect ? 'right' : 'wrong'}`);

		if (isCorrect) {
			score += 1;
			clearAnswer();
			generateQuestion();
		}
	}

	function clearAnswer() {
		answer = '';
		initSpeechRecognition();
	}

	function skipQuestion() {
		skips += 1;
		generateQuestion();
	}

	function onKeyPress(e: KeyboardEvent) {
		if (e.key === 'c') clearAnswer();
		if (e.key === ' ') submitAnswer();
		if (e.key === 'n') skipQuestion();
	}

	type Operation = (a: number, b: number) => number;
	const numbers: Record<string, string> = {
		one: '1',
		two: '2',
		three: '3',
		four: '4',
		five: '5',
		six: '6',
		seven: '7',
		eight: '8',
		nine: '9',
		ten: '10',
		eleven: '11',
		twelve: '12',
		thirteen: '13',
		fourteen: '14',
		fifteen: '15',
		sixteen: '16',
		seventeen: '17',
		eightteen: '18',
		nineteen: '19',
		twenty: '20',
		thirty: '30',
		forty: '40',
		fifty: '50',
		sixty: '60',
		seventy: '70',
		eighty: '80',
		ninety: '90'
	};
	const fns: Record<Operator, Operation> = {
		'+': (a, b) => a + b,
		'-': (a, b) => a - b,
		'×': (a, b) => a * b,
		'÷': (a, b) => a / b
	};
</script>

<svelte:window on:keypress={onKeyPress} />

{#if status === 'initial'}
	<button on:click={onClickInit}>Start</button>
{:else}
	<section class="question" on:click={skipQuestion}>
		<div>{number1}</div>
		<div>{operator}</div>
		<div>{number2}</div>
	</section>

	<section class="answer" on:click={submitAnswer}>
		<div>{answer}</div>
	</section>

	<section class="score">
		<div>Score: {score}</div>
		{#if score > highscore}
			<div class="highscore">High Score</div>
		{/if}
	</section>

	<footer>
		<p>Speak your answer<br /></p>
		<p>Say <strong>ANSWER</strong> to submit<br /></p>
		<p>Say <strong>CLEAR</strong> to ignore previous speech<br /></p>
		<p>Say <strong>SKIP</strong> to try another question</p>
	</footer>
{/if}

<!-- <button on:click={() => console.time('voice')}>Timer</button> -->
<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
	}
	:global(body) {
		background: url(/bg.png) no-repeat center center / cover;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}
	:global(body > div) {
		display: contents;
	}

	.question {
		width: 100%;
		display: flex;
		gap: 2rem;
		justify-content: center;
	}

	.question,
	.answer,
	.score {
		font-size: 4rem;
		font-family: 'Courier New', Courier, monospace;
		text-align: center;
	}

	.answer {
		min-height: 20vh;
		color: white;
		text-shadow: 0 0 10px black;
		font-size: 6rem;
	}

	.score {
		color: lightgrey;
		font-size: 1.4rem;
	}
	.highscore {
		font-size: 1rem;
		color: hotpink;
		text-transform: uppercase;
		padding: 0.5rem;
	}

	footer {
		position: absolute;
		bottom: 0;
		padding: 1rem;
		text-align: center;
		font-family: monospace;
	}
	footer > p {
		margin: 0;
		line-height: 1.6;
	}

	button {
		all: unset;

		padding: 1rem 3rem;
		border: 1px solid white;
		color: white;
		font-size: 3rem;
		border-radius: 50px;
		text-transform: uppercase;
		font-family: 'Courier New', Courier, monospace;
	}
</style>
