class SlimValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.slides = [];
        
        this.validCommands = ['title', 'type', 'data', 'slide', 'meta'];
        
        this.validSlideTypes = [
            'title',
            'text-only',
            'image-text',
            'image-left',
            'image-right',
            'two-column',
            'code',
            'list',
            'quote',
            'video'
        ];
    }

    
    validate(slimContent) {
        this.errors = [];
        this.warnings = [];
        this.slides = [];

        if (!slimContent || slimContent.trim() === '') {
            this.errors.push({
                line: 0,
                message: 'Празно съдържание',
                type: 'error'
            });
            return this.getResult();
        }

        const lines = slimContent.split('\n');
        let currentSlide = null;
        let lineNumber = 0;

        for (let line of lines) {
            lineNumber++;
            line = line.trim();

            if (line === '' || line.startsWith('//')) {
                continue;
            }

            if (line.startsWith('#')) {
                this.parseCommand(line, lineNumber, currentSlide);
                
                if (line.startsWith('#slide')) {
                    if (currentSlide) {
                        this.validateSlide(currentSlide);
                        this.slides.push(currentSlide);
                    }
                    currentSlide = {
                        slideNumber: this.slides.length + 1,
                        title: null,
                        type: null,
                        data: {},
                        startLine: lineNumber
                    };
                } else if (line.startsWith('#title')) {
                    const title = line.substring(6).trim();
                    if (currentSlide) {
                        currentSlide.title = title;
                    } else {
                        currentSlide = {
                            slideNumber: 1,
                            title: title,
                            type: null,
                            data: {},
                            startLine: lineNumber
                        };
                    }
                } else if (line.startsWith('#type')) {
                    const type = line.substring(5).trim();
                    if (currentSlide) {
                        currentSlide.type = type;
                        this.validateSlideType(type, lineNumber);
                    } else {
                        this.errors.push({
                            line: lineNumber,
                            message: '#type без предхождащ #title или #slide',
                            type: 'error'
                        });
                    }
                } else if (line.startsWith('#data')) {
                    const dataStr = line.substring(5).trim();
                    if (currentSlide) {
                        this.parseData(dataStr, lineNumber, currentSlide);
                    } else {
                        this.errors.push({
                            line: lineNumber,
                            message: '#data без предхождащ слайд',
                            type: 'error'
                        });
                    }
                }
            } else {
                this.warnings.push({
                    line: lineNumber,
                    message: `Ред без команда: "${line.substring(0, 30)}..."`,
                    type: 'warning'
                });
            }
        }

        if (currentSlide) {
            this.validateSlide(currentSlide);
            this.slides.push(currentSlide);
        }

        if (this.slides.length === 0) {
            this.errors.push({
                line: 0,
                message: 'Няма намерени слайдове',
                type: 'error'
            });
        }

        return this.getResult();
    }

    parseCommand(line, lineNumber, currentSlide) {
        const commandMatch = line.match(/^#(\w+)/);
        if (commandMatch) {
            const command = commandMatch[1];
            if (!this.validCommands.includes(command)) {
                this.warnings.push({
                    line: lineNumber,
                    message: `Непозната команда: #${command}`,
                    type: 'warning'
                });
            }
        }
    }

    validateSlideType(type, lineNumber) {
        if (!this.validSlideTypes.includes(type)) {
            this.warnings.push({
                line: lineNumber,
                message: `Непознат тип слайд: "${type}". Поддържани: ${this.validSlideTypes.join(', ')}`,
                type: 'warning'
            });
        }
    }

    parseData(dataStr, lineNumber, currentSlide) {
        const pairs = dataStr.split(';');
        
        for (let pair of pairs) {
            pair = pair.trim();
            if (pair === '') continue;

            const equalIndex = pair.indexOf('=');
            if (equalIndex === -1) {
                this.warnings.push({
                    line: lineNumber,
                    message: `Невалиден формат на данни: "${pair}". Очакван формат: key=value`,
                    type: 'warning'
                });
                continue;
            }

            const key = pair.substring(0, equalIndex).trim();
            const value = pair.substring(equalIndex + 1).trim();

            if (key === '' || value === '') {
                this.warnings.push({
                    line: lineNumber,
                    message: `Празен ключ или стойност в: "${pair}"`,
                    type: 'warning'
                });
                continue;
            }

            currentSlide.data[key] = value;
        }
    }

    validateSlide(slide) {
        if (!slide.title || slide.title === '') {
            this.errors.push({
                line: slide.startLine,
                message: `Слайд ${slide.slideNumber} няма заглавие (#title)`,
                type: 'error'
            });
        }

        if (!slide.type || slide.type === '') {
            this.errors.push({
                line: slide.startLine,
                message: `Слайд ${slide.slideNumber} няма тип (#type)`,
                type: 'error'
            });
        }

        if (slide.type) {
            this.validateSlideData(slide);
        }
    }

    validateSlideData(slide) {
        const type = slide.type;
        const data = slide.data;

        switch (type) {
            case 'title':
                if (!data.subtitle && !data.author) {
                    this.warnings.push({
                        line: slide.startLine,
                        message: `Заглавен слайд без subtitle или author`,
                        type: 'warning'
                    });
                }
                break;

            case 'text-only':
                if (!data.content) {
                    this.errors.push({
                        line: slide.startLine,
                        message: `Текстов слайд без content`,
                        type: 'error'
                    });
                }
                break;

            case 'image-text':
            case 'image-left':
            case 'image-right':
                if (!data.image) {
                    this.errors.push({
                        line: slide.startLine,
                        message: `Слайд с изображение без image параметър`,
                        type: 'error'
                    });
                }
                if (!data.text && !data.content) {
                    this.warnings.push({
                        line: slide.startLine,
                        message: `Слайд с изображение без text или content`,
                        type: 'warning'
                    });
                }
                break;

            case 'two-column':
                if (!data.left || !data.right) {
                    this.errors.push({
                        line: slide.startLine,
                        message: `Двуколонен слайд без left или right параметри`,
                        type: 'error'
                    });
                }
                break;

            case 'code':
                if (!data.code && !data.content) {
                    this.errors.push({
                        line: slide.startLine,
                        message: `Код слайд без code или content`,
                        type: 'error'
                    });
                }
                break;

            case 'list':
                if (!data.items && !data.content) {
                    this.errors.push({
                        line: slide.startLine,
                        message: `Списък слайд без items или content`,
                        type: 'error'
                    });
                }
                break;
        }
    }

    getResult() {
        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            slides: this.slides,
            slideCount: this.slides.length,
            summary: this.getSummary()
        };
    }

    getSummary() {
        if (this.errors.length === 0 && this.warnings.length === 0) {
            return `✓ Валидна презентация с ${this.slides.length} слайда`;
        } else if (this.errors.length === 0) {
            return `✓ Валидна с ${this.warnings.length} предупреждения`;
        } else {
            return `✗ ${this.errors.length} грешки, ${this.warnings.length} предупреждения`;
        }
    }

    getStatistics(slimContent) {
        const lines = slimContent.split('\n');
        const nonEmptyLines = lines.filter(l => l.trim() !== '').length;
        const commandLines = lines.filter(l => l.trim().startsWith('#')).length;
        
        return {
            totalLines: lines.length,
            nonEmptyLines: nonEmptyLines,
            commandLines: commandLines,
            slideCount: this.slides.length,
            characters: slimContent.length
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SlimValidator;
}