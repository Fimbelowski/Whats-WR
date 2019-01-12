Vue.component('wr-button', {
    props: ['isButtonDisabled'],
    methods: {
        emitButtonClicked: function() {
            this.$emit('button-clicked');
        }
    },
    template: ' <section class="l-wr-button-container">\
                    <button type="button" :disabled="isButtonDisabled" @click="emitButtonClicked" class="wr-button">\
                        <h1>What\'s WR?</h1>\
                    </button>\
                </section>'
});