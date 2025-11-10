/**
 * Procedural Learning Experiment
 * Uses Serial Reaction Time (SRT) task to measure procedural learning ability
 */

// Initialize jsPsych
const jsPsych = initJsPsych({
    on_finish: function() {
        // Calculate and display the final score
        const data = jsPsych.data.get().filter({task: 'srt'});
        const correct_trials = data.filter({correct: true}).count();
        const total_trials = data.count();
        const accuracy = Math.round((correct_trials / total_trials) * 100);
        
        // Calculate average reaction time for correct responses
        const correct_rts = data.filter({correct: true}).select('rt').values;
        const avg_rt = Math.round(correct_rts.reduce((a, b) => a + b, 0) / correct_rts.length);
        
        // Calculate learning score (higher is better)
        // Score based on accuracy and speed
        const learning_score = Math.round((accuracy * 100) / (avg_rt / 10));
        
        // Display results
        jsPsych.getDisplayElement().innerHTML = `
            <div class="jspsych-content">
                <h1>Task Complete!</h1>
                <div class="score-display">
                    <h2>Your Procedural Learning Score: ${learning_score}</h2>
                    <p>Accuracy: ${accuracy}%</p>
                    <p>Average Response Time: ${avg_rt}ms</p>
                </div>
                <p style="margin-top: 30px;">
                    This score reflects your ability to learn and respond to sequential patterns.<br>
                    Higher scores indicate better procedural learning abilities.
                </p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px;">
                    Restart Experiment
                </button>
            </div>
        `;
    }
});

// Welcome screen
const welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="jspsych-content">
            <h1>Welcome to the Procedural Learning Task</h1>
            <p>This experiment tests your ability to learn patterns.</p>
            <p>Press any key to continue.</p>
        </div>
    `
};

// Instructions
const instructions = {
    type: jsPsychInstructions,
    pages: [
        `<div class="jspsych-content">
            <h2>Instructions</h2>
            <p>In this task, you will see a grid with 4 locations.</p>
            <p>A target will appear in one of these locations.</p>
            <p>Your job is to respond as quickly as possible when you see the target.</p>
        </div>`,
        `<div class="jspsych-content">
            <h2>How to Respond</h2>
            <p>Use the following keys to respond:</p>
            <ul style="text-align: left; display: inline-block;">
                <li><strong>Z</strong> - Left-most position</li>
                <li><strong>X</strong> - Second position</li>
                <li><strong>C</strong> - Third position</li>
                <li><strong>V</strong> - Right-most position</li>
            </ul>
            <p>Try to be as fast and accurate as possible!</p>
        </div>`,
        `<div class="jspsych-content">
            <h2>Ready to Begin?</h2>
            <p>The task will start with a few practice trials.</p>
            <p>After that, the main task will begin.</p>
            <p>Click 'Next' or press the right arrow key to start.</p>
        </div>`
    ],
    show_clickable_nav: true
};

// Create a sequence pattern for procedural learning
// Using a repeating sequence to test implicit learning
const sequence_pattern = [0, 2, 1, 3, 2, 0, 3, 1]; // Repeating pattern

// Practice trials (random, no pattern)
const practice_trials = {
    type: jsPsychSerialReactionTime,
    grid: [[1, 1, 1, 1]],
    target: jsPsych.timelineVariable('target'),
    choices: ['z', 'x', 'c', 'v'],
    data: {
        task: 'srt',
        phase: 'practice'
    },
    post_trial_gap: 250
};

const practice_procedure = {
    timeline: [practice_trials],
    timeline_variables: [
        { target: [0, 0] },
        { target: [0, 1] },
        { target: [0, 2] },
        { target: [0, 3] },
        { target: [0, 1] },
        { target: [0, 3] },
        { target: [0, 2] },
        { target: [0, 0] }
    ],
    randomize_order: true
};

// Practice feedback
const practice_feedback = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        const practice_data = jsPsych.data.get().filter({phase: 'practice'});
        const correct = practice_data.filter({correct: true}).count();
        const total = practice_data.count();
        const accuracy = Math.round((correct / total) * 100);
        
        return `
            <div class="jspsych-content">
                <h2>Practice Complete!</h2>
                <p>You got ${correct} out of ${total} correct (${accuracy}%).</p>
                <p>Now the main task will begin.</p>
                <p>Press any key to continue.</p>
            </div>
        `;
    }
};

// Main task trials (with repeating pattern)
const main_trials = {
    type: jsPsychSerialReactionTime,
    grid: [[1, 1, 1, 1]],
    target: jsPsych.timelineVariable('target'),
    choices: ['z', 'x', 'c', 'v'],
    data: {
        task: 'srt',
        phase: 'main',
        block: jsPsych.timelineVariable('block')
    },
    post_trial_gap: 250
};

// Create multiple blocks with the repeating sequence
const num_blocks = 5;
const num_repetitions = 4; // Number of times to repeat the sequence per block

// Build the timeline array
const timeline = [welcome, instructions, practice_procedure, practice_feedback];

for (let block = 0; block < num_blocks; block++) {
    const timeline_vars = [];
    for (let rep = 0; rep < num_repetitions; rep++) {
        for (let i = 0; i < sequence_pattern.length; i++) {
            timeline_vars.push({
                target: [0, sequence_pattern[i]],
                block: block
            });
        }
    }
    
    const block_procedure = {
        timeline: [main_trials],
        timeline_variables: timeline_vars
    };
    
    timeline.push(block_procedure);
    
    // Add a break between blocks (except after the last block)
    if (block < num_blocks - 1) {
        const break_screen = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `
                <div class="jspsych-content">
                    <h2>Break</h2>
                    <p>You've completed block ${block + 1} of ${num_blocks}.</p>
                    <p>Take a short break if you need it.</p>
                    <p>Press any key to continue.</p>
                </div>
            `,
            post_trial_gap: 500
        };
        timeline.push(break_screen);
    }
}

// Run the experiment
jsPsych.run(timeline);
