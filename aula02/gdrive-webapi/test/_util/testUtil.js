import { jest } from "@jest/globals";

// static pois não vou trabalhar com constructors()
import { Readable, Transform, Writable } from "stream";

// 00:00 V
// 00:01 X --> V
// 00:02 X --> X --> V

export default class TestUtil {

    static mockDateNow(mockImplementationPeriods) {
        const now = jest.spyOn(global.Date, global.Date.now.name)

        mockImplementationPeriods.forEach(time => {
            now.mockReturnValueOnce(time)
        })
    }

    static getTimeFromDate(dateString) {
        return new Date(dateString).getTime()
    }

    static generateReadableStream(data) {
        return new Readable({
            objectMode: true,
            read() {
                for( const item of data) {
                    this.push(item)
                }

                this.push(null)
            }
        })
    }

    static generateWritableStream(onData) {
        return new Writable({
            objectMode: true,
            write(chunk, encoding, callback) {
                onData(chunk)

                callback(null, chunk)
            }
        })
    }

    static generateTransformStream(onData) {
        return new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                onData(chunk)
                callback(null, chunk)
            }
        })
    }
}