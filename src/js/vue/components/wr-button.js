Vue.component('wr-button', {
    props: ['isButtonDisabled'],
    methods: {
        emitButtonClicked: function() {
            this.$emit('button-clicked');
        }
    },
    template: ' <section class="l-wr-button">\
                    <button type="button" :disabled="isButtonDisabled" @click="emitButtonClicked">\
                        <p>Get WR</p>\
                    </button>\
                </section>'
});