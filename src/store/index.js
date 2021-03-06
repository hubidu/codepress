import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'

const vuexLocal = new VuexPersistence({
  storage: window.localStorage
})

const store = new Vuex.Store({
    state: {
        isRunning: undefined,
        show: 'source',
        lastSnapshot: undefined,
        selectedStep: undefined,
        tests: [],

        scenarios: {
          selectedScenario: undefined,
        },

        cli: undefined,
    },
    mutations: {
      clearTests: (state) => {
        state.tests = [];
        state.selectedStep = undefined;
        state.cli = undefined;
      },
      addTest: (state, test) => {
        Vue.set(test, 'steps', [])
        Vue.set(test, 'result', 'running');
        Vue.set(state, 'tests', [...state.tests, test])
      },
      addStepToCurrentTest: (state, step) => {
        const currentTest = state.tests[state.tests.length - 1];
  
        if (step.snapshot) {
          state.lastSnapshot = step.snapshot;
        } else {
          Vue.set(step, 'snapshot', state.lastSnapshot);
        }
        Vue.set(step, 'result', 'passed');
        currentTest.steps.push(step);
      },
      addMetaStepToCurrentTest: (state, metastep) => {
        const currentTest = state.tests[state.tests.length - 1];
        if (!metastep) {
          currentTest.steps.push({
            type: 'meta',
            result: 'passed',
          });  
        } else {
          currentTest.steps.push({
            type: 'meta',
            result: 'passed',
            ...metastep
          });
        }
      },
      markAsFailedCurrentTest: (state, data) => {
        const currentTest = state.tests[state.tests.length - 1];
        const currentStep = currentTest.steps[currentTest.steps.length - 1];
  
        currentTest.result = 'failed';
        Vue.set(currentTest, 'error', data.error);
        Vue.set(currentTest, 'duration', data.duration);

        Vue.set(currentStep, 'result', 'failed');
        if (data.snapshot) {
          Vue.set(currentStep, 'snapshot', data.snapshot);
        }
      },
      markAsPassedCurrentTest: (state, data) => {
        const currentTest = state.tests[state.tests.length - 1];
        const currentStep = currentTest.steps[currentTest.steps.length - 1];

        Vue.set(currentTest, 'duration', data.duration);
        currentTest.result = 'passed';
        if (data.snapshot) {
          Vue.set(currentStep, 'snapshot', data.snapshot);
        }
      },
      setSelectedStep: (state, selectedStep) => {
        if (!selectedStep) return;
  
        state.selectedStep = selectedStep;
      },
      setRunning: (state, isRunning) => {
        state.isRunning = isRunning;
      },

      setShowImage: (state) => {
        state.show = 'image';
      },
      setShowSource: (state) => {
        state.show = 'source';
      },

      startCli: (state, data) => {
        state.cli = state.cli ? state.cli : {};
        
        state.cli.prompt = data.prompt;
        if (data.commands) {
          state.cli.commands = data.commands;
        }
      },
      stopCli: (state) => {
        state.cli = undefined;
      },
      clearCliError: (state) => {
        state.cli.message = undefined;
      },
      setCliError: (state, data) => {
        if (!state.cli) return;

        state.cli.message = data.message;
      },

      selectScenario: (state, scenario) => {
        state.scenarios.selectedScenario = scenario;
      }
    },
    plugins: [vuexLocal.plugin]
});

export default store;