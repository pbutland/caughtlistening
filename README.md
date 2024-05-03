# caughtlistening

This repository contains transcript data from the Trump New York trial, indictment #71543/2023 (https://pdfs.nycourts.gov/PeopleVs.DTrump-71543/transcripts/).

The first transcript provided by the [New York State Unified Court System](https://ww2.nycourts.gov/press/index.shtml) was originally in PDF format.  However, this was almost immediately taken down and replaced by, what can only be described as, an utterly retarded and almost unusable alternative.  I'm sure that they have their reasons.  Being American probably chief among them.

The way that the transcripts have been published is that each page of a transcript is a separate HTML page and within this page an embedded image displays the text.  As an image!!!

This is, of course, extremely unhelpful in many ways.
For example, some of these ways are:
* it makes it extremely hard to view the material offline
* it makes it impossible to search the transcripts
* it makes it hard to go to a certain section of a transcript

To add insult to injury, they are using Cloudflare to verify that users are "human", which means that users are periodically asked to verify that they do actually exist.

This repository is here simply to make the information in the transcripts easier to use by converting the hosted images into text using OCR software.

## Directory structure

All transcript data is under the `transcripts` directory and, under this directory, there is a directory for each day of the trial.

Within each directory for each trial there are the following directories:
* `html` - the content for the original HTML pages as hosted by the NY court system.
* `images` - the images that are embedded in the above mentioned HTML files.
* `text` - contains a text file for each of the image files mentioned above.

That describes the "raw" data.  However, at the top directory level of each trial directory there is a file that combines all of the individual text files.  It attempts to format the text so that it can be easily read as input for another program (see [What's next?](#what-next)).

In addition to this, there is also a PDF file which represents the content of the original transcripts.

## Generated text

The text was generated using the [Apache Tesseract OCR](https://github.com/tesseract-ocr/tesseract) engine.

This project has two main engines:
* an LSTM engine (v4), which uses a neural net to convert the images into text.
* a legacy engine (v3), which uses good ol' fashioned pattern recognition.

Due to the fact that the transcript is typed, the legacy version appears to be slighty better, so that is the version that is used for the generation of the text within this repository.

## Code

Eventually the code that converted these images into the text will be available in this repository.  However, it isn't rocket science and is a pretty straightforward process.

## What next?

Great question!

The original intent of this project was to see if it was possible to generate an audio version of the transcripts using Text-To-Speech (TTS).

A proof of concept (POC) was done based on the data within this repository (hence the reformatting of the text), using the [ElevenLabs](https://elevenlabs.io/) voice API to synthesize voices.  Ideally a different one for each character.

Eventually the code for this POC will be uploaded to this repository.  However, in the meantime, there is a sample of the generated audio [here](transcript-audio-sample.mp3).

## Disclaimers

* No guarantee is provided that any files within this repository are accurate representations of the original transcripts.
The original transcripts hosted at https://pdfs.nycourts.gov/PeopleVs.DTrump-71543/transcripts/ are the source of truth and any reference to the transcripts should cite these instead of anything in this repository.
* No guarantee is given that the directory structure or file formats will remain the same.  The location of, name of, and content of any files within this repository may change at any time without notice.  The files within this repository should therefore not be treated as a API for any system outside of this repository.

## Additional information

No AI entities (sentient or otherwise) were harmed in the production of this data.