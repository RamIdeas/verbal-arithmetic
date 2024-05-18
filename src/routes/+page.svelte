<script lang="ts">
	let number1: number;
	let number2: number;
	let operator: Operator;
	let answer = '';
	let score = 0;
	let skips = 0;
	let listening = false;
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
	function getRandomNumber(max: number, min = 1) {
		return Math.floor(Math.random() * max) + min;
	}
	function generateQuestion() {
		// pick operator outside loop to ensure equal chance of each operator
		// the isReasonable check favours addition (and subtraction) over multiplication and division
		const op = getRandomOperator();
		while (true) {
			const n1 = getRandomNumber(99, 2);
			const n2 = getRandomNumber(99, 2);
			const fn = fns[op];
			const correctAnswer = fn(n1, n2);
			const isInt = Number.isInteger(correctAnswer);
			const isReasonable = correctAnswer > 0 && correctAnswer <= 999;
			const isTrivial = correctAnswer === 1;

			if (!isInt || !isReasonable || isTrivial) continue;

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

		recognition?.removeEventListener('start', onSpeechRecognitionStart);
		recognition?.removeEventListener('result', onSpeechRecognitionResult);
		recognition?.removeEventListener('error', onSpeechRecognitionError);
		recognition?.removeEventListener('end', onSpeechRecognitionEnd);
		if (listening) recognition?.abort();

		recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;

		recognition.addEventListener('start', onSpeechRecognitionStart);
		recognition.addEventListener('result', onSpeechRecognitionResult);
		recognition.addEventListener('error', onSpeechRecognitionError);
		recognition.addEventListener('end', onSpeechRecognitionEnd);

		recognition.start();
	}
	function onSpeechRecognitionStart() {
		console.log('recognition.start');
		// console.time('recognition');
		listening = true;
	}
	function onSpeechRecognitionResult(event: SpeechRecognitionEvent) {
		let result = event.results.item(event.resultIndex).item(0).transcript;
		console.log({ speech: result });

		if (result.includes('clear')) {
			clearAnswer();
			return;
		}

		if (result.includes('skip')) {
			skipQuestion();
			return;
		}

		if (result.includes('next') || /\bon\b/.test(result)) {
			initSpeechRecognition();
			submitAnswer();
			return;
		}

		result = result
			.replaceAll(
				new RegExp(Object.keys(replacements).join('|'), 'gi'),
				(match) => replacements[match.toLowerCase()] ?? match.toLowerCase()
			)
			.replaceAll(/\D/g, '');

		if (result) answer = result;
	}
	function onSpeechRecognitionError(event: SpeechRecognitionErrorEvent) {
		console.error('recognition.error', event.error);
		listening = false;
		if (event.error !== 'aborted') initSpeechRecognition();
	}
	function onSpeechRecognitionEnd() {
		console.log('recognition.end');
		// console.timeEnd('recognition');
		listening = false;
		setTimeout(() => {
			if (!listening) initSpeechRecognition();
		}, 1000);
	}

	function submitAnswer({ animate = true } = {}) {
		if (animate) animateCommand('answer');

		if (!answer) return;

		const fn = fns[operator];
		const correctAnswer = fn(number1, number2);
		const parsedAnswer = parseInt(answer, 10);
		const isCorrect = parsedAnswer === correctAnswer;

		console.log(`${parsedAnswer} is ${isCorrect ? 'right' : 'wrong'}`);

		if (isCorrect) {
			score += 1;
			document
				.querySelector('.answer')
				?.animate(
					[
						{ transform: 'scale(1.3)', opacity: '0.5', color: 'green' },
						{ transform: 'scale(1.6)', opacity: '0', color: 'green' }
					],
					{
						duration: 500,
						iterations: 1
					}
				)
				.finished.then(() => {
					clearAnswer({ animate: false });
				});
			generateQuestion();
		} else {
			document
				.querySelector('.answer')
				?.animate(
					[
						{ transform: 'translateX(-1px)' },
						{ transform: 'translateX(2px)' },
						{ transform: 'translateX(-4px)' },
						{ transform: 'translateX(4px)', color: 'tomato' },
						{ transform: 'translateX(-4px)' },
						{ transform: 'translateX(4px)' },
						{ transform: 'translateX(-4px)' },
						{ transform: 'translateX(2px)', color: 'white' },
						{ transform: 'translateX(-1px)' }
					],
					{
						duration: 500,
						iterations: 1
					}
				);
		}
	}

	function clearAnswer({ animate = true } = {}) {
		if (animate) animateCommand('clear');
		answer = '';
		initSpeechRecognition();
	}

	function skipQuestion({ animate = true } = {}) {
		if (animate) animateCommand('skip');
		skips += 1;
		generateQuestion();
		initSpeechRecognition();
	}

	function onKeyPress(e: KeyboardEvent) {
		if (e.key === 'c') clearAnswer();
		if (e.key === ' ') submitAnswer();
		if (e.key === 'n') skipQuestion();
	}

	function animateCommand(command: 'answer' | 'clear' | 'skip') {
		document
			.querySelector(`.instructions-${command} strong`)
			?.animate(
				[{ filter: 'brightness(1)' }, { filter: 'brightness(1.5)' }, { filter: 'brightness(1)' }],
				{
					duration: 300,
					iterations: 3
				}
			);
	}

	type Operation = (a: number, b: number) => number;
	const replacements: Record<string, string> = {
		one: '1',
		what: '1',
		warn: '1',
		two: '2',
		to: '2',
		too: '2',
		three: '3',
		four: '4',
		for: '4',
		or: '4',
		five: '5',
		six: '6',
		sex: '6',
		set: '6',
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
	<section class="question" on:click={() => skipQuestion()}>
		<div>{number1}</div>
		<div>{operator}</div>
		<div>{number2}</div>
	</section>

	<section class="answer" on:click={() => submitAnswer()}>
		<div>{answer}</div>
	</section>

	<section class="score">
		<div>Score: {score}</div>
		{#if score > highscore}
			<div class="highscore">High Score</div>
		{/if}
	</section>

	<footer on:click={initSpeechRecognition}>
		{#if !listening}
			<p class="instructions-error">Tap here to reset speech recognition</p>
		{:else}
			<p class="instructions-speak">Speak your answer</p>
			<p class="instructions-answer">Say <strong>NEXT</strong> to submit</p>
			<p class="instructions-clear">Say <strong>CLEAR</strong> to ignore previous speech</p>
			<p class="instructions-skip">Say <strong>SKIP</strong> to try another question</p>
		{/if}
	</footer>
{/if}

<!-- <button on:click={() => console.time('voice')}>Timer</button> -->
<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
	}
	:global(body) {
		background: url(/bg.jpg) no-repeat center center / cover;

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
		color: lightgray;
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
		cursor: pointer;
	}
</style>
