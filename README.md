# Retrieval practice: does testing improve later memory?

A standalone classroom word-pair experiment for Lecture 6: Long-term memory II.

## Files and launch

- `index.html`: page structure.
- `styles.css`: layout and bar charts.
- `stimuli.js`: 24 original word pairs.
- `script.js`: trial sequence, scoring, local saving, predictions, exports, and follow-up.

## Procedure and timing

1. **Study:** 24 pairs, 6 seconds each (144 seconds).
2. **Practice round 1:** 12 restudy and 12 retrieval trials, randomly ordered.
3. **Practice round 2:** the same assignments, newly shuffled order.
4. **Predictions:** expected correct answers out of 12 for each condition, plus an ease rating from 1–7.
5. **Delay:** 15 minutes for a later-lecture test, or 24/48 hours. A visible countdown runs from the end of the second practice round. The final-test button stays grey and disabled until the countdown reaches zero, then turns green. Reloading preserves the original deadline. There is no mandatory filler activity; continue the lecture or other activities without reviewing the pairs.
6. **Final recall:** all 24 cues, randomly ordered, 6 seconds each, with no feedback.
7. **Results:** bar chart, interpretation, predictions versus performance, practice accuracy, CSV/JSON downloads.

Every practice trial lasts 8 seconds. Restudy shows the pair for all 8 seconds. Retrieval provides 6 seconds to answer, then 2 seconds showing the correct pair. Submitting early locks the response without advancing or revealing feedback early. Therefore, both conditions have the same scheduled total practice time, including feedback. The amount of target-word exposure differs by design.

Active trial time is **11 minutes 12 seconds**, plus predictions and instruction screens. A later-lecture run has an additional minimum 15-minute delay. Timers are wall-clock based and are not paused when the tab loses focus. Tab changes and resumptions are logged. A resumed expired trial ends immediately; the next trial starts when the app resumes. Interrupted or distracted sessions should be reviewed before analysis.

## Assignment and counterbalancing

Each student practises 12 pairs through retrieval and 12 through restudy. The condition stays the same across both practice rounds.

Version A assigns even-numbered pair IDs to retrieval; version B reverses every assignment. Each version has exactly 12 pairs per condition. By default the program randomly chooses A or B, which does not guarantee equal class counts. For exact class counterbalancing, distribute equal numbers of these links:

- `index.html?version=A`
- `index.html?version=B`

## Scoring and data

Each correct target earns 1 point; each condition has a maximum of 12. Scoring ignores case, spaces, and punctuation. It requires the target word; misspellings, synonyms, and blank answers are incorrect. Submitted and unsubmitted typed answers are both scored when time expires. A correct answer is not required to continue. No automatic spelling correction or approximate semantic scoring is used.

CSV contains one row per completed trial, including session UUID, assignment version, planned delay, phase, cue, target, condition, raw response, correctness, submission status, response time when explicitly submitted, timing, predictions, ease rating, and attention-event count. Restudy and initial-study correctness cells are blank, not zero. JSON also includes saved state and detailed attention events. A response not explicitly submitted has a blank response time; its typed content is still preserved and scored. CSV text fields beginning with spreadsheet formula characters are prefixed with an apostrophe for safe opening in spreadsheet software; JSON retains the original text.

Accuracy is reported separately by condition. Practice accuracy is available only for retrieval trials. Predictions refer to the first final test and are shown alongside that test's actual scores. There is no fabricated comparison group or claim of statistical significance.

An optional second test can be scheduled from the results screen, 24 or 48 hours after scheduling. **The first final test gives both conditions extra retrieval practice.** The follow-up therefore assesses retention after this shared extra test, rather than an untouched delayed effect of the original practice assignment. For a cleaner delayed comparison, choose 24 or 48 hours at the beginning and do not take an earlier final test.

## Study basis and materials reuse

Roediger, H. L., III, & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x

[Author-hosted full paper](https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf).

The paper used prose passages rather than word pairs, with free recall and no practice feedback. Its passages, “The Sun” and “Sea Otters,” came from Rogers's TOEFL preparation book. This implementation uses newly written pairs and changes the practice and test format. It should be described as an adaptation, not a replication. The original finding also distinguishes short-delay performance from delayed retention; the app does not promise a retrieval advantage for every student.

The original word-pair list in `stimuli.js` is dedicated to the public domain under CC0-1.0. Code is supplied under the MIT license in `LICENSE`. No original paper text, figures, passages, or scoring keys are bundled.

