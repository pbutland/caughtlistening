# caughtlistening

This repository contains transcript data from the Trump New York trial, indictment #71543/2023 (https://pdfs.nycourts.gov/PeopleVs.DTrump-71543/transcripts/).

The first transcript provided by the [New York State Unified Court System](https://ww2.nycourts.gov/press/index.shtml) was originally in PDF format.  However, this was almost immediately taken down and replaced by, what can only be described as, an utterly retarded and almost unusable alternative.  I'm sure that they have their reasons.  Being American probably chief among them.

The way that the transcripts were published is that each page of a transcript is a separate HTML page and within this page an embedded image displays the text.  As an image!!!

This is, of course, extremely unhelpful in many ways.
For example, some of these ways are:
* it makes it extremely hard to view the material offline
* it makes it impossible to search the transcripts
* it makes it hard to go to a certain section of a transcript

To add insult to injury, they are using Cloudflare to verify that users are "human", which means that users are periodically asked to verify that they do actually exist.

This repository is here simply to make the information in the transcripts easier to use by converting the hosted images into text using OCR software.

> **_Note:_** Since the creation of this repository, the transcripts as described above have now been replaced by the original PDF format.  This repository now contains text generated from the PDF files rather than the original HTML files.

## Directory structure

All transcript data can be found in the `transcripts/data` directory and, under this directory, there is a directory for each day of the trial.

Within each directory for each trial there are the following subdirectories:

| filename        | description                                                                                 |
|-----------------|---------------------------------------------------------------------------------------------|
| `html`          | the content for the original HTML pages as hosted by the NY court system                    |
| `text`          | contains a text file for each page of the a transcript PDF file |

That describes the "raw" data.  However, at the top `transcripts` directory level, there are also the following files:

| filename                    | description                                                                         |
|-----------------------------|-------------------------------------------------------------------------------------|
| `<YYMMDD>.txt`              | formatted text combining all of the individual generated text files for each trial  |
| `<YYMMDD>.pdf`              | PDF file which is an exact copy of the original transcripts                         |
| `<YYMMDD>.json`             | json file containing pertinent information for each line in a transcript            |
| `<YYMMDD>-openvoice-v1.mp3` | MP3 audio file representing a TTS of a transcript using OpenVoice V1                |

## Generated text

The text was generated using the [Apache Tesseract OCR](https://github.com/tesseract-ocr/tesseract) engine.

This project has two main engines:
* an LSTM engine (v4), which uses a neural net to convert the images into text.
* a legacy engine (v3), which uses good ol' fashioned pattern recognition.

Due to the fact that the transcript is typed, the legacy version appears to be slighty better, so that is the version that is used for the generation of the text within this repository.

## Code

The source code used to generate the data files within this repository can be found at [caughtlistening-tools](https://github.com/pbutland/caughtlistening-tools).

## What next?

Great question!

The original intent of this project was to see if it was possible to generate an audio version of the transcripts using Text-To-Speech (TTS).

A proof of concept (POC) was done based on the data within this repository, using the [ElevenLabs](https://elevenlabs.io/) voice API to synthesize voices.  Allocating a different voice for each character. Here is a sample of the generated audio [here](transcript-sample-elevenlabs.mp3).  
An additional POC was done using [OpenVoice](https://github.com/myshell-ai/OpenVoice).  Samples of the generated audio for v1 and v2 can be found [here](transcript-sample-openvoice-v1.mp3) and [here](transcript-sample-openvoice-v2.mp3) respectively.
Both POCs can be found at [caughtlistening-tools](https://github.com/pbutland/caughtlistening-tools).

## Disclaimers

* No guarantee is provided that any files within this repository are accurate representations of the original transcripts.
The original transcripts hosted at https://pdfs.nycourts.gov/PeopleVs.DTrump-71543/transcripts/ are the source of truth and any reference to the transcripts should cite these instead of anything in this repository.
* No guarantee is given that the directory structure or file formats will remain the same.  The location of, name of, and content of any files within this repository may change at any time without notice.  The files within this repository should therefore not be treated as a API for any system outside of this repository.  All attempts will be made to keep the JSON files backwardly compatible where possible, but the structure is under active development.

## Additional information

No AI entities (sentient or otherwise) were harmed in the production of this data.